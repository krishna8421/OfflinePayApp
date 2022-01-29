import React, {useState} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import Login from '../components/Login';
import Register from '../components/Register';

export default function Auth() {
  const [login, setLogin] = useState<boolean>(true);

  const setLoginProp = (tf: boolean) => {
    setLogin(tf);
  };

  return (
    <View style={styles.AuthView}>
      <Image source={require('..//assets/images/OfflinePay.png')} />
      {login ? (
        <Login setLogin={setLoginProp} />
      ) : (
        <Register setLogin={setLoginProp} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  AuthView: {
    alignItems: 'center',
    width: '100%',
  },
});
