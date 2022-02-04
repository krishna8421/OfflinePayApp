import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode, {JwtPayload} from 'jwt-decode';
import axios from 'axios';
import * as Yup from 'yup';
import {View, Text, StyleSheet} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {useEffect} from 'react';
import {Formik} from 'formik';
import {Button, Input} from 'react-native-elements';
import RNRestart from 'react-native-restart';
import {reFetch} from '../../utils/reFetch';
import {URL} from "../../utils/constants"
import moment from 'moment';
//@ts-ignore
import SmsAndroid from 'react-native-get-sms-android';

interface Props {
  closeTransfer: () => void;
}

export default function Transfer({closeTransfer}: Props) {
  const [error, setError] = useState({
    status: false,
    message: '',
  });
  const [isConnectedToNet, setIsConnectedToNet] = useState<boolean | null>(
    false,
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnectedToNet(state.isConnected);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  type TransferData = {
    num: number;
    amount: number;
  };

  const transferMoney = async (data: TransferData) => {
    const sessionToken = await AsyncStorage.getItem('@jwt_token');
    if (!sessionToken) {
      throw new Error('No session token');
    }
    const decoded = jwtDecode<JwtPayload>(sessionToken);

    // @ts-ignore
    const {num} = decoded;
    const {num: num_to, amount} = data;

    // Offline Transfer Logic
    if (!isConnectedToNet) {
      const localBalString = await AsyncStorage.getItem('@current_balance');
      if (!localBalString) {
        return;
      }
      const localBal = parseInt(localBalString, 10);
      const localLogsString = await AsyncStorage.getItem('@logs');
      if (!localLogsString) {
        return;
      }
      let toSyncArrStr = await AsyncStorage.getItem('@to_sync');
      let toSyncArr;
      if (!toSyncArrStr) {
        toSyncArrStr = '[]';
      }
      toSyncArr = JSON.parse(toSyncArrStr);
      const toSyncItem = {
        num,
        num_to,
        amount,
      };
      toSyncArr.push(toSyncItem);
      let logsArrStr = await AsyncStorage.getItem('@logs');
      let logsArr;
      if (!logsArrStr) {
        logsArrStr = '[]';
      }
      logsArr = JSON.parse(logsArrStr);
      logsArr.push(
        `[${moment().format(
          'Do MMM YYYY, h:mm a',
        )}] Send Rs.${amount} to +91${num_to}`,
      );

      const newAmount = localBal - amount;
      await AsyncStorage.setItem('@current_balance', JSON.stringify(newAmount));
      await AsyncStorage.setItem('@to_sync', JSON.stringify(toSyncArr));
      await AsyncStorage.setItem('@logs', JSON.stringify(logsArr));

      // SMS Logic
      SmsAndroid.autoSend(
        `+91${num_to}`,
        `${num} has sent you Rs.${amount}`,
        //@ts-ignore
        fail => {
          setError({
            status: true,
            message: `Failed with this error: ${fail}`,
          });
        },
        //@ts-ignore
        success => {
          setError({
            status: false,
            message: `SMS ${success} successfully`,
          });
        },
      );
    
      RNRestart.Restart();
    }

    const res = await axios.post(
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
    if (res.data.status === 'error') {
      setError({
        status: true,
        message: res.data.error,
      });
    }

    if (res.data.status === 'success') {
      setError({
        status: false,
        message: '',
      });
    }
    const refetchData = await reFetch(sessionToken);
    const {logs, balance} = refetchData;
    await AsyncStorage.setItem('@current_balance', JSON.stringify(balance));
    await AsyncStorage.setItem('@logs', JSON.stringify(logs));
    RNRestart.Restart();
  };

  const transferSchema = Yup.object().shape({
    num: Yup.string()
      .matches(/([5-9]{1})[0-9]{9}/, 'Must be a Number')
      .required('Required'),
    amount: Yup.string()
      .min(0, 'Amount cannot be less than 0')
      .matches(/^[+]?([.]\d+|\d+([.]\d+)?)$/, 'Out of Range')
      .required('Required'),
  });
  return (
    <View style={styles.View}>
      <Text style={styles.Heading}> Transfer </Text>
      <Formik
        initialValues={{
          num: '',
          amount: '',
        }}
        validationSchema={transferSchema}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            const {num, amount} = values;
            await transferMoney({
              num: parseInt(num, 10),
              amount: parseInt(amount, 10),
            });
            actions.setSubmitting(false);
          }, 1000);
        }}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          values,
          errors,
        }) => (
          <View style={styles.FormBox}>
            <Input
              label="Number"
              errorMessage={errors.num}
              autoCompleteType="tel"
              onChangeText={handleChange('num')}
              onBlur={handleBlur('num')}
              value={values.num}
              maxLength={10}
              keyboardType="numeric"
            />
            <Input
              autoCompleteType="off"
              label="Amount"
              errorMessage={errors.amount}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              value={values.amount}
              keyboardType="numeric"
            />
            <Button
              title="Submit"
              loading={isSubmitting}
              buttonStyle={{backgroundColor: 'rgba(39, 39, 39, 1)'}}
              containerStyle={{
                width: 200,
                marginHorizontal: 50,
                marginVertical: 10,
              }}
              titleStyle={{color: 'white', marginHorizontal: 20}}
              // @ts-ignore
              onPress={handleSubmit}
            />
            <Button
              title="Cancel"
              buttonStyle={{backgroundColor: 'rgba(255, 7, 7, 0.8)'}}
              containerStyle={{
                width: 200,
                height: 50,
                marginHorizontal: 50,
                marginVertical: 9,
              }}
              titleStyle={{color: 'white', marginHorizontal: 20}}
              // @ts-ignore
              onPress={closeTransfer}
            />
            <Text style={styles.backendErrText}>
              {error.status ? error.message : ''}{' '}
            </Text>
          </View>
        )}
      </Formik>
    </View>
  );
}
const styles = StyleSheet.create({
  View: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  Heading: {
    color: 'black',
    fontSize: 25,
    fontWeight: '300',
  },
  backendErrText: {
    fontSize: 15,
    fontWeight: '300',
    color: 'red',
  },
  FormBox: {
    width: '80%',
    marginVertical: 60,
    alignItems: 'center',
  },
});
