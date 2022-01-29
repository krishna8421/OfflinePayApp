import React, {Fragment} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Button, Input} from 'react-native-elements';
import {useState} from 'react';
import axios from 'axios';
import * as Yup from 'yup';
import {Formik} from 'formik';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export default function Register({setLogin}: any) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState({
    status: false,
    message: '',
  });
  const handleClick = () => setShow(!show);
  type RegisterData = {
    name: string;
    pass: string;
    num: number;
  };
  const registerUser = async (data: RegisterData) => {
    const res = await axios.post(
      'https://offline-pay.vercel.app/api/register',
      data,
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
      await AsyncStorage.setItem('@jwt_token', res.data.token);
      await AsyncStorage.setItem('@current_balance', '0');
      RNRestart.Restart();
    }
  };

  const registerSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, 'Too Short!')
      .max(40, 'Too Long!')
      .required('Required'),
    pass: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/^[a-zA-Z0-9 #?!@$%^&*-]/, 'Must be Alphanumeric')
      .required('Required'),
    num: Yup.string()
      .matches(/([5-9]{1})[0-9]{9}/, 'Must be a Number')
      .required('Required'),
  });

  return (
    <View style={styles.loginRegTextBox}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        style={{flex: 1}}
        contentContainerStyle={{alignItems: 'center'}}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.HeadingText}>Register</Text>
        <Formik
          initialValues={{
            name: '',
            num: '',
            pass: '',
          }}
          validationSchema={registerSchema}
          onSubmit={(values, actions) => {
            setTimeout(async () => {
              const {name, num, pass} = values;
              await registerUser({
                name,
                num: parseInt(num, 10),
                pass,
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
            <Fragment>
              <Input
                autoCompleteType="name"
                label="Name"
                errorMessage={errors.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
                maxLength={40}
              />
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
                label="Password"
                autoCompleteType="password"
                errorMessage={errors.pass}
                secureTextEntry={show ? false : true}
                onChangeText={handleChange('pass')}
                onBlur={handleBlur('pass')}
                value={values.pass}
                rightIcon={
                  <Button
                    title={show ? 'Hide' : 'Show'}
                    buttonStyle={{
                      backgroundColor: 'rgba(233, 233, 233, 0.8)',
                      borderRadius: 10,
                    }}
                    containerStyle={{
                      width: 50,
                      height: 30,
                    }}
                    titleStyle={{
                      color: 'black',
                      marginHorizontal: 1,
                      fontSize: 10,
                    }}
                    onPress={handleClick}
                  />
                }
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
              <Text style={styles.backendErrText}>
                {error.status ? error.message : ''}{' '}
              </Text>
            </Fragment>
          )}
        </Formik>
        <Text style={styles.loginRegText}>
          Already a member?
          <Text
            onPress={() => {
              setLogin(true);
            }}
            style={{color: 'rgba(78, 116, 289, 1)', fontSize: 18}}>
            &nbsp; Login
          </Text>
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  HeadingText: {
    fontSize: 30,
    fontWeight: '200',
    marginTop: 60,
    marginBottom: 70,
  },
  loginRegTextBox: {
    height: '90%',
    width: '65%',
  },
  loginRegText: {
    marginTop: 30,
    fontSize: 19,
    fontWeight: '300',
    bottom: 0,
  },
  backendErrText: {
    fontSize: 15,
    fontWeight: '300',
    color: 'red',
  },
});
