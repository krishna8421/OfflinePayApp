import {PermissionsAndroid,Platform,StyleSheet, View, Text, StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Auth from './screens/Auth';
import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode, {JwtPayload} from 'jwt-decode';
import DashBoard from './screens/DashBoard';
import NetInfo from '@react-native-community/netinfo';
import {Button} from 'react-native-elements';
import RNRestart from 'react-native-restart';

export default function App() {
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [isConnectedToNet, setIsConnectedToNet] = useState<boolean | null>(
    true,
  );

  // const permission =()=>{
  //   PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.SEND_SMS,
  //     PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  //     PermissionsAndroid.PERMISSIONS.READ_SMS
  //   )
  //  }

  //  useEffect(()=>{
  //    if(Platform.OS === 'ios') return;
  //    permission()
  //    },[])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnectedToNet(state.isConnected);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = await AsyncStorage.getItem('@jwt_token');
      if (sessionToken) {
        const decoded = jwtDecode<JwtPayload>(sessionToken);
        // @ts-ignore
        const {name: Name, number} = decoded;
        if (number !== null || number !== '') {
          setName(Name);
          setIsLogin(true);
        }
      }
    };
    checkAuth();
  }, []);

  if (!isLogin && !isConnectedToNet) {
    return (
      <SafeAreaProvider>
        <View style={styles.noNet}>
          <Text>No Internet Connection!!</Text>
          <Button
            onPress={async () => {
              RNRestart.Restart();
            }}
            icon={{
              name: 'refresh',
              type: 'font-awesome',
              size: 30,
              color: 'white',
            }}
            iconContainerStyle={styles.refreshIconsContainerStyle}
            buttonStyle={styles.refreshButtonStyle}
            containerStyle={styles.refreshContainerStyle}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isLogin) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <Auth />
        </View>
        <StatusBar backgroundColor="rgba(0, 209, 111, 0.85)" />
      </SafeAreaProvider>
    );
  }
  return <DashBoard name={name} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  noNet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noNetText: {
    fontSize: 25,
    color: 'red',
  },
  refreshButtonStyle: {
    backgroundColor: 'rgba(251, 113, 15, 0.8)',
    borderColor: 'transparent',
    borderRadius: 30,
    padding: 5,
  },
  refreshIconsContainerStyle: {marginRight: 6, marginVertical: 5},
  refreshContainerStyle: {
    position: 'absolute',
    bottom: 60,
    right: 40,
  },
});
