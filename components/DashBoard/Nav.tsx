import React, {useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Image, Icon} from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import NetInfo from '@react-native-community/netinfo';
import {useState} from 'react';

export default function Nav() {
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

  const logout = async () => {
    await AsyncStorage.removeItem('@jwt_token');
    RNRestart.Restart();
  };
  return (
    <View style={styles.NavView}>
      <View style={styles.ImageView}>
        <Image
          resizeMode="stretch"
          containerStyle={styles.Image}
          source={require('../../assets/images/OfflinePay.png')}
        />
        {isConnectedToNet ? null : (
          <View
            style={{
              backgroundColor: 'black',
              height: 20,
              padding: 4,
              borderRadius: 7,
              marginLeft: 5,
            }}>
            <Text style={{color: 'white', fontSize: 10}}>offline</Text>
          </View>
        )}
      </View>
      <Icon
        type="antdesign"
        name="logout"
        onPress={logout}
        color="red"
        //IDK????
        tvParallaxProperties
      />
    </View>
  );
}

const styles = StyleSheet.create({
  NavView: {
    width: '100%',
    height: 60,
    marginTop: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  ImageView: {
    width: 135,
    height: 30,
    marginTop: 6,
    flexDirection: 'row',
  },
  Image: {
    height: '100%',
    width: '100%',
  },
});
