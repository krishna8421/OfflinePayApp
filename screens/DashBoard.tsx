import {StyleSheet, View, Text, StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Nav from '../components/DashBoard/Nav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import Transfer from '../components/DashBoard/Transfer';
import Logs from '../components/DashBoard/Logs';
import {Overlay} from 'react-native-elements';
import {TouchableWithoutFeedback} from 'react-native';
import {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {reFetch} from '../utils/reFetch';
import moment from 'moment';
import axios from 'axios';
//@ts-ignore
import SmsAndroid from 'react-native-get-sms-android';
import RNRestart from 'react-native-restart';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {URL} from '../utils/constants';

Entypo.loadFont().then();
FontAwesome.loadFont().then();

type Props = {
  name: string;
};

export default function DashBoard({name}: Props) {
  const [showTransferMenu, setShowTransferMenu] = useState<boolean>(false);
  const [showLogMenu, setShowLogMenu] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastMsgTime, setLastMsgTime] = useState<number>(0);
  const [isConnectedToNet, setIsConnectedToNet] = useState<boolean | null>(
    true,
  );
  const sleep = (ms = 1000) => new Promise(r => setTimeout(r, ms));

  const sync = async () => {
    const token = await AsyncStorage.getItem('@jwt_token');
    await sleep();
    if (!token) {
      return;
    }
    const newData = await reFetch(token);
    const {logs, balance} = newData;
    await AsyncStorage.setItem('@current_balance', JSON.stringify(balance));
    await AsyncStorage.setItem('@logs', JSON.stringify(logs));
  };

  // Sync when internet in connected
  type TransferForm = {
    num: string;
    amount: string;
    num_to: string;
  };
  useEffect(() => {
    setLastMsgTime(Date.now());
  }, []);
  useEffect(() => {
    const transfer = async ({num_to, num, amount}: TransferForm) => {
      const sessionToken = await AsyncStorage.getItem('@jwt_token');
      if (!sessionToken) {
        throw new Error('No session token');
      }
      await axios.post(
        `${URL}/api/transfer`,
        {
          num_from: num,
          num_to,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        },
      );
      const refetchData = await reFetch(sessionToken);
      const {logs, balance} = refetchData;
      await AsyncStorage.setItem('@current_balance', JSON.stringify(balance));
      await AsyncStorage.setItem('@logs', JSON.stringify(logs));
    };

    const syncOnline = async () => {
      const toSyncItemString = await AsyncStorage.getItem('@to_sync');
      if (isConnectedToNet && toSyncItemString) {
        const toSyncItem = JSON.parse(toSyncItemString);
        toSyncItem.map(async (data: TransferForm) => {
          await transfer(data);
        });
        await AsyncStorage.setItem('@to_sync', '');
        RNRestart.Restart();
      }
    };
    syncOnline();
  }, [isConnectedToNet]);

  useEffect(() => {
    const getSMS = () => {
      sleep(4000);
      let filter = {
        box: 'inbox',
        body: '',
        indexFrom: 0,
        maxCount: 1,
      };
      SmsAndroid.list(
        JSON.stringify(filter),
        //@ts-ignore
        fail => {
          console.error('Failed with this error: ' + fail);
        },
        //@ts-ignore
        async (_, smsList) => {
          const arr = JSON.parse(smsList);
          const middleBody = arr[0].body.split('.')[0].split('has ')[1];
          const msgSendTime: number = arr[0].date_sent;

          if (middleBody !== 'sent you Rs') {
            return;
          }
          if (moment(lastMsgTime).isSameOrAfter(msgSendTime)) {
            return;
          }
          setLastMsgTime(msgSendTime);

          const numFromStr = arr[0].body.split(' ')[0];
          const numFrom = parseInt(numFromStr, 10);
          const amountStr = arr[0].body.split('.')[1];
          const amount = parseInt(amountStr, 10);
          const localBalString = await AsyncStorage.getItem('@current_balance');
          if (!localBalString) {
            return;
          }
          let logsArrStr = await AsyncStorage.getItem('@logs');
          let logsArr;
          if (!logsArrStr) {
            logsArrStr = '[]';
          }
          logsArr = JSON.parse(logsArrStr);
          logsArr.push(
            `[${moment().format(
              'Do MMM YYYY, h:mm a',
            )}] Received Rs.${amount} from +91${numFrom}`,
          );
          const localBal = parseInt(localBalString, 10);
          const newAmount = localBal + amount;
          await AsyncStorage.setItem('@logs', JSON.stringify(logsArr));
          await AsyncStorage.setItem(
            '@current_balance',
            JSON.stringify(newAmount),
          );
          RNRestart.Restart();
        },
      );
    };
    if (!isConnectedToNet) {
      getSMS();
    }
  }, [isConnectedToNet, lastMsgTime]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnectedToNet(state.isConnected);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const toggleTransferOverlay = () => {
    setShowTransferMenu(!showTransferMenu);
  };

  const toggleLogOverlay = () => {
    setShowLogMenu(!showLogMenu);
  };

  (async () => {
    const balance = await AsyncStorage.getItem('@current_balance');
    if (!balance) {
      setBalance(0);
      return;
    }
    setBalance(parseInt(balance, 10));
  })();

  const getLogs = async () => {
    const log = await AsyncStorage.getItem('@logs');
    if (!log) {
      return;
    }
    const logArr = JSON.parse(log);
    setLogs(logArr);
  };

  return (
    <SafeAreaProvider style={{backgroundColor: 'white'}}>
      <View style={styles.DashBoardView}>
        <Nav />
        <Text style={styles.welcomeTxt}>Welcome,</Text>
        <Text style={styles.nameTxt}>{name}</Text>
      </View>
      <View style={{alignItems: 'center'}}>
        <View style={styles.currentBalance}>
          <Text style={styles.currentBalanceText}> Current Balance </Text>
          <Text style={styles.currentBalanceTextRs}>₹ {balance} </Text>
        </View>
      </View>
      <View style={{alignItems: 'center'}}>
        <View style={styles.transferAndLogs}>
          <TouchableWithoutFeedback onPress={toggleTransferOverlay}>
            <View style={styles.transfer}>
              <Text style={styles.transferText}>Transfer</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onPress={() => {
              toggleLogOverlay();
              getLogs();
            }}>
            <View style={styles.logs}>
              <Text style={styles.logText}>Logs</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <Overlay
          isVisible={showTransferMenu}
          onBackdropPress={toggleTransferOverlay}
          overlayStyle={styles.overlayLayoutTransfer}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps={'always'}
            style={{flex: 1}}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={false}>
            <Transfer closeTransfer={toggleTransferOverlay} />
          </KeyboardAwareScrollView>
        </Overlay>
        <Overlay
          isVisible={showLogMenu}
          onBackdropPress={toggleLogOverlay}
          overlayStyle={styles.overlayLayoutLogs}>
          <Logs logs={logs} />
          <Entypo
            name="circle-with-cross"
            onPress={toggleLogOverlay}
            color="black"
            size={50}
            style={styles.closeLogs}
          />
        </Overlay>
      </View>
      <View style={styles.refreshButtonView}>
        <FontAwesome
          onPress={async () => {
            if (isConnectedToNet) {
              await sync();
              // await AsyncStorage.setItem('@to_sync', '');
              RNRestart.Restart();
            } else {
              // @ts-ignore
              alert('Please connect to internet');
            }
          }}
          name="refresh"
          color="white"
          size={30}
        />
      </View>
      <StatusBar backgroundColor="rgba(0, 209, 111, 0.85)" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  DashBoardView: {
    width: '100%',
    paddingTop: 0,
  },
  welcomeTxt: {
    fontSize: 30,
    fontWeight: '100',
    paddingHorizontal: 25,
    marginTop: 15,
    color: 'black',
  },
  nameTxt: {
    fontSize: 47,
    fontWeight: '300',
    paddingHorizontal: 25,
    marginTop: 10,
    color: 'black',
  },
  currentBalance: {
    width: '90%',
    marginTop: 40,
    backgroundColor: 'rgba(0, 209, 111, 0.85)',
    paddingHorizontal: 40,
    paddingVertical: 35,
    borderRadius: 20,
  },
  currentBalanceText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '300',
    marginBottom: 10,
  },
  currentBalanceTextRs: {
    color: 'white',
    fontSize: 30,
    marginLeft: 9,
  },
  transferAndLogs: {
    width: '90%',
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transfer: {
    width: '47%',
    backgroundColor: '#6E4CF6',
    height: 175,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logs: {
    width: '47%',
    backgroundColor: '#474554',
    height: 175,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferText: {
    color: 'white',
    fontSize: 25,
    fontWeight: '500',
  },
  logText: {
    color: 'white',
    fontSize: 25,
    fontWeight: '500',
  },
  overlayLayoutLogs: {
    height: '85%',
    width: '90%',
    borderRadius: 10,
  },
  overlayLayoutTransfer: {
    height: '70%',
    width: '90%',
    justifyContent: 'center',
    position: 'absolute',
    borderRadius: 10,
  },
  closeLogs: {
    position: 'absolute',
    marginLeft: 'auto',
    marginRight: 'auto',
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
  },
  refreshButtonView: {
    position: 'absolute',
    bottom: 60,
    right: 40,
    backgroundColor: 'rgba(251, 113, 15, 0.8)',
    borderColor: 'transparent',
    borderRadius: 30,
    padding: 10,
    paddingHorizontal: 13,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
});
