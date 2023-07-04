import { StackScreenProps } from '@react-navigation/stack';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';




const SignUpScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    error: ''
  })

  const auth = getAuth();

  const db = getFirestore();
  // useEffect(() => {
      
  //           const newUser = {
  //             email: value.email,
  //             location: 'test',
  //           }
  //           addDoc(collection(db, 'users'), newUser)
  // .then((docRef) => {
  //   console.log('Document written with ID: ', docRef.id);
  //   // Handle success or perform any additional operations here
  // })
  // .catch((error) => {
  //   console.error('Error adding document: ', error);
  //   // Handle error here
  // });
          
        
  // }, [])
  async function signUp() {
    if (value.email === '' || value.password === '') {
      setValue({
        ...value,
        error: 'Email and password are mandatory.'
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
      <Text>Signup screen!</Text>

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

export default SignUpScreen;