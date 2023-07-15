import { StackScreenProps } from '@react-navigation/stack';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';




const BusinessSignUpScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    truckName: '',
    truckNumber: '',
    error: ''
  })


  const auth = getAuth();

  const db = getFirestore();
  async function signUp() {
    if (value.email === '' || value.password === '' || value.truckName === '' || value.truckNumber === '') {
      setValue({
        ...value,
        error: 'ALL fields are mandatory.'
      })
      return;
    }
  
    try {
      const {user} = await createUserWithEmailAndPassword(auth, value.email, value.password);
      const userRef = collection(db, 'users');
      await addDoc(userRef, {
        uid: user.uid,
        email: user.email,
        location: {},
        owner: false,
        lastActiveTime: '',
        truckName: value.truckName,
        truckNumber: value.truckNumber,

      })
      navigation.navigate('Sign In');
    } catch (error) {
      setValue({
        ...value,
        error: error.message,
      })
    }
  }

  return (
    <View style={styles.container}>
      <Text>Food Truck Owner Signup Form:</Text>

      {!!value.error && <View style={styles.error}><Text>{value.error}</Text></View>}

      <View style={styles.controls}>
        <Input
          placeholder='Email'
          containerStyle={styles.control}
          value={value.email}
          onChangeText={(text) => setValue({ ...value, email: text })}
          leftIcon={<Icon
            name='envelope'
            size={16}
          />}
        />

        <Input
          placeholder='Password'
          containerStyle={styles.control}
          value={value.password}
          onChangeText={(text) => setValue({ ...value, password: text })}
          secureTextEntry={true}
          leftIcon={<Icon
            name='key'
            size={16}
          />}
        />
        <Input
          placeholder='Food Truck Name'
          containerStyle={styles.control}
          value={value.truckName}
          onChangeText={(text) => setValue({ ...value, truckName: text })}
          secureTextEntry={false}
          leftIcon={<Icon
            name='truck'
            size={16}
          />}
        />
        <Input
          placeholder='Food Truck Number'
          containerStyle={styles.control}
          value={value.truckNumber}
          onChangeText={(text) => setValue({ ...value, truckNumber: text })}
          secureTextEntry={false}
          keyboardType='phone-pad'
          leftIcon={<Icon
            name='phone'
            size={16}
          />}
        />

        <Button title="Sign up" buttonStyle={styles.control} onPress={signUp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controls: {
    flex: 1,
    width: '60%'

  },

  control: {
    marginTop: 10
  },

  error: {
    marginTop: 10,
    padding: 10,
    color: '#fff',
    backgroundColor: '#D54826FF',
  }
});

export default BusinessSignUpScreen;