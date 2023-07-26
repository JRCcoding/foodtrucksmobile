import { Picker } from '@react-native-picker/picker'
import * as Location from 'expo-location'
import { getAuth } from 'firebase/auth'
import {
  collection,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button, Icon } from 'react-native-elements'
import MapView, { MarkerAnimated } from 'react-native-maps'
import { useAuthentication } from '../utils/hooks/useAuthentication'

export default function Home() {
  const [modalVisible, setModalVisible] = useState(false)
  const [location, setLocation] = useState(null)
  const [lat, setLat] = useState(null)
  const [long, setLong] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthentication()
  const auth = getAuth()
  const [refreshing, setRefreshing] = useState(false)
  const db = getFirestore()
  const [live, setLive] = useState(false)
  const [userInfo, setUserInfo] = useState()
  const [liveTime, setLiveTime] = useState()
  const [liveTill, setLiveTill] = useState()
  const pickerRef = useRef()

  function open() {
    pickerRef.current.focus()
  }

  function close() {
    pickerRef.current.blur()
  }
  useEffect(() => {
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        return
      }

      let location = await Location.getCurrentPositionAsync({})
      setLocation(location)
      setLat(parseFloat(JSON.stringify(location.coords.latitude)))
      setLong(parseFloat(JSON.stringify(location.coords.longitude)))
      setIsLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (user && lat && long) {
      const updateFirebaseLocation = async (uid, latitude, longitude) => {
        const usersCollectionRef = collection(db, 'users')

        // Create a query to find the user document with matching uid
        const q = query(usersCollectionRef, where('uid', '==', uid))

        // try {
        const querySnapshot = await getDocs(q)

        // Assuming there's only one user document with the given uid
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]

          // Update the location field of the user document
          await updateDoc(userDoc.ref, {
            location: {
              latitude,
              longitude,
            },
          })

          const userData = userDoc.data()
          setUserInfo(userDoc.data())
          const live = userData?.live
          setLive(live)
          console.log('User location updated successfully!')
        } else {
          console.log('User not found with the specified uid.')
        }
        // }
        // catch (error) {
        //   console.error('Error updating user location:', error)
        // }
      }

      updateFirebaseLocation(user.uid, lat, long)
    }
  }, [user, lat, long])

  function addTimes(time1, time2) {
    // Helper function to convert time string to minutes since midnight
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(/:| /)
      let totalMinutes = parseInt(hours % 12) * 60 + parseInt(minutes)

      return totalMinutes
    }

    const totalMinutes1 = timeToMinutes(time1)
    const totalMinutes2 = timeToMinutes(time2)

    // Add the minutes together
    let sumMinutes = totalMinutes1 + totalMinutes2

    // Calculate the result time in "hh:mm AM/PM" format
    const sumHours = Math.floor(sumMinutes / 60) % 12
    const sumMinutesRemainder = sumMinutes % 60
    const ampm = sumMinutes >= 720 ? 'PM' : 'AM'

    // Format the result with leading zeros
    const resultTime = `${String(sumHours).padStart(2, '0')}:${String(
      sumMinutesRemainder
    ).padStart(2, '0')} ${ampm}`

    return resultTime
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    setLocation(null)
    setLat(null)
    setLong(null)
    setErrorMsg(null)
    setIsLoading(true)

    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        setIsLoading(false)
        setRefreshing(false)
        return
      }

      let location = await Location.getCurrentPositionAsync({})
      setLocation(location)
      setLat(parseFloat(JSON.stringify(location.coords.latitude)))
      setLong(parseFloat(JSON.stringify(location.coords.longitude)))
      setIsLoading(false)
    } catch (error) {
      console.error('Error refreshing location:', error)
      setErrorMsg('Error refreshing location')
      setIsLoading(false)
    }

    setRefreshing(false)
  }

  const handleGoLive = async () => {
    if (!liveTime && !live) {
      alert('Choose how long you will be on location')
      return
    }

    const usersCollectionRef = collection(db, 'users')
    const q = query(usersCollectionRef, where('uid', '==', user.uid))
    try {
      const querySnapshot = await getDocs(q)

      // Assuming there's only one user document with the given uid
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        function formatDate(date) {
          const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: 'America/Chicago',
          }
          return date.toLocaleString('en-US', options)
        }

        const currentDate = new Date()
        const formattedDate = formatDate(currentDate)
        console.log(formattedDate)
        setLiveTill(addTimes(formattedDate, liveTime))

        // Update the location field of the user document
        if (!live) {
          await setDoc(
            // Use await to ensure the state update completes before the next operation.
            userDoc.ref,
            {
              live: !live,
              lastActiveTime: formattedDate,
              liveUntil: liveTill, // Use liveTill directly here, as it should have the updated value.
            },
            { merge: true }
          )
        } else {
          await setDoc(
            userDoc.ref,
            {
              live: !live,
              lastActiveTime: '',
              liveUntil: '',
            },
            { merge: true }
          )
        }
        setLive(!live)
        console.log('User location updated successfully!')
        handleRefresh()
      } else {
        console.log('User not found with the specified uid.')
      }
    } catch (error) {
      console.error('Error updating user location:', error)
    }
  }
  const signOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.log(error)
    }
  }

  const formatTimestamp = (firebaseTimestamp) => {
    if (!firebaseTimestamp) {
      return '' // Return an empty string or handle the null/undefined case as per your requirement
    }

    const date = new Date(firebaseTimestamp.seconds * 1000) // Convert to milliseconds

    const options = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }

    const formattedTimestamp = date.toLocaleString('en-US', options)

    return formattedTimestamp
  }
  const handleNumberChange = async (newNumber) => {
    const usersCollectionRef = collection(db, 'users')
    const q = query(usersCollectionRef, where('uid', '==', user.uid))
    try {
      const querySnapshot = await getDocs(q)

      // Assuming there's only one user document with the given uid
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]

        // Update the location field of the user document
        await updateDoc(userDoc.ref, {
          truckNumber: newNumber,
        })
        console.log('Number updated!')
      } else {
        console.log('User not found with the specified uid.')
      }
    } catch (error) {
      console.error('Error updating truck number:', error)
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.welcome}>
        <Text style={styles.welcomename}>{userInfo?.truckName}</Text>
        <Button title='Refresh' style={styles.button} onPress={handleRefresh} />
        <View style={styles.signoutbutton}>
          <Button title='Sign Out' onPress={() => signOut(auth)} />
        </View>
      </View>

      {refreshing && <Text>Refreshing...</Text>}

      {!isLoading ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: lat,
            longitude: long,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {live && (
            <MarkerAnimated
              coordinate={{
                latitude: lat,
                longitude: long,
              }}
              title='Your Food Truck'
            />
          )}
        </MapView>
      ) : (
        <View>
          <Button
            title='Refresh'
            style={styles.button}
            onPress={handleRefresh}
          />
        </View>
      )}
      {/* <Button
        title='Edit Info'
        style={styles.button}
        onPress={() => setModalVisible(true)}
      />
      <Modal
        animationType='fade'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible)
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text>
                <Icon name='close' />
              </Text>
            </Pressable>
            <Text style={styles.truckTitle}>{userInfo?.truckName}</Text>
            <Text>PHONE: {userInfo?.truckNumber}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Input
                country='US'
                value={newNumber}
                onChangeText={setNewNumber}
                style={{ textAlign: 'center' }}
              />
              <Button
                title='Update Phone'
                onPress={() => handleNumberChange(newNumber)}
              />
            </View>
          </View>
        </View>
      </Modal> */}
      {!live && (
        <View style={styles.livecontainer2}>
          <Text>How long will you be open?</Text>
          <View style={styles.pickerContainer}>
            <Picker
              ref={pickerRef}
              selectedValue={liveTime}
              onValueChange={(val, ind) => setLiveTime(val)}
            >
              <Picker.Item key='Pick one' label='Pick one' value='Pick one' />
              <Picker.Item key='1:00' label='1:00' value='1:00' />
              <Picker.Item key='1:30' label='1:30' value='1:30' />
              <Picker.Item key='2:00' label='2:00' value='2:00' />
              <Picker.Item key='2:30' label='2:30' value='2:30' />
              <Picker.Item key='3:00' label='3:00' value='3:00' />
              <Picker.Item key='3:30' label='3:30' value='3:30' />
              <Picker.Item key='4:00' label='4:00' value='4:00' />
              <Picker.Item key='4:30' label='4:30' value='4:30' />
              <Picker.Item key='5:00' label='5:00' value='5:00' />
              <Picker.Item key='5:30' label='5:30' value='5:30' />
              <Picker.Item key='6:00' label='6:00' value='6:00' />
              <Picker.Item key='6:30' label='6:30' value='6:30' />
              <Picker.Item key='7:00' label='7:00' value='7:00' />
              <Picker.Item key='7:30' label='7:30' value='7:30' />
              <Picker.Item key='8:00' label='8:00' value='8:00' />
              <Picker.Item key='8:30' label='8:30' value='8:30' />
              <Picker.Item key='9:00' label='9:00' value='9:00' />
              <Picker.Item key='9:30' label='9:30' value='9:30' />
              <Picker.Item key='10:00' label='10:00' value='10:00' />
              <Picker.Item key='10:30' label='10:30' value='10:30' />
              <Picker.Item key='11:00' label='11:00' value='11:00' />
              <Picker.Item key='11:30' label='11:30' value='11:30' />
              <Picker.Item key='12:00' label='12:00' value='12:00' />
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.livecontainer}>
        <Button
          title={live ? 'Go offline' : 'Go LIVE!'}
          style={styles.button}
          onPress={handleGoLive}
        />
        {live ? (
          <Icon name='circle' color='green' />
        ) : (
          <Icon name='circle' color='red' />
        )}
        <Text>
          {live && 'Live Since:'}
          {live ? (
            userInfo && userInfo.lastActiveTime ? (
              <Text style={{ marginLeft: '10%', marginBottom: '20%' }}>
                {userInfo?.lastActiveTime}
              </Text>
            ) : (
              <Text style={{ marginLeft: '10%', marginBottom: '20%' }}>
                Not Available
              </Text>
            )
          ) : (
            <Text
              style={{
                marginLeft: '10%',
                marginBottom: '20%',
              }}
            >
              Not Live
            </Text>
          )}
        </Text>

        <Text>{live && `Live Until: ${userInfo?.liveUntil}`}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  welcome: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  welcomename: {
    fontSize: 20,
  },
  button: {
    marginTop: 10,
  },
  buttonClose: {
    marginLeft: 'auto',
    marginRight: '-5%',
    marginTop: '-7%',
  },
  map: {
    width: '100%',
    height: '50%',
    marginTop: '10%',
    marginBottom: '10%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 65,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '75%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  truckTitle: {
    fontSize: 21,
    marginBottom: '15%',
  },
  livecontainer: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livecontainer2: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    width: '50%',
  },
})
