import * as Location from 'expo-location'
import { getAuth } from 'firebase/auth'
import {
  collection,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Icon, Input } from 'react-native-elements'
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
  const [lastActiveTime, setLastActiveTime] = useState(null) // Add lastActiveTime state
  const [userInfo, setUserInfo] = useState()

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

        try {
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
              lastActiveTime: new Date(), // Update lastActiveTime when updating location
            })

            const userData = userDoc.data()
            setUserInfo(userDoc.data())
            const live = userData.live
            setLive(live)
            console.log('User location updated successfully!')
          } else {
            console.log('User not found with the specified uid.')
          }
        } catch (error) {
          console.error('Error updating user location:', error)
        }
      }

      updateFirebaseLocation(user.uid, lat, long)
    }
  }, [user, lat, long])

  useEffect(() => {
    if (user) {
      const checkUserStatus = async (uid) => {
        const usersCollectionRef = collection(db, 'users')

        // Create a query to find the user document with matching uid
        const q = query(usersCollectionRef, where('uid', '==', uid))

        try {
          const querySnapshot = await getDocs(q)

          // Assuming thereis only one user document with the given uid
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            const live = userData.live
            const lastActiveTime = userData.lastActiveTime

            // Check if the user was active within the last 2 hours
            const twoHoursAgo = new Date()
            twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

            if (
              live &&
              lastActiveTime &&
              lastActiveTime.toDate() > twoHoursAgo
            ) {
              setLive(true)
            } else {
              setLive(false)
            }
          } else {
            console.log('User not found with the specified uid.')
          }
        } catch (error) {
          console.error('Error checking user status:', error)
        }
      }

      checkUserStatus(user.uid)
    }
  }, [user])

  const handleGoLive = async () => {
    const usersCollectionRef = collection(db, 'users')
    const q = query(usersCollectionRef, where('uid', '==', user.uid))
    try {
      const querySnapshot = await getDocs(q)

      // Assuming there's only one user document with the given uid
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        function formatDate(date) {
          const options = {
            month: '2-digit',
            day: '2-digit',
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
        // Update the location field of the user document
        await updateDoc(userDoc.ref, {
          live: !live,
          lastActiveTime: new Date(), // Update lastActiveTime when changing live status
        })
        setLive(!live)
        console.log('User location updated successfully!')
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
  const [newName, setNewName] = useState()
  const handleNameChange = async (newName) => {
    const usersCollectionRef = collection(db, 'users')
    const q = query(usersCollectionRef, where('uid', '==', user.uid))
    try {
      const querySnapshot = await getDocs(q)

      // Assuming there's only one user document with the given uid
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]

        // Update the location field of the user document
        await updateDoc(userDoc.ref, {
          truckName: newName,
        })
        setLive(!live)
        console.log('Name updated!')
      } else {
        console.log('User not found with the specified uid.')
      }
    } catch (error) {
      console.error('Error updating truck name:', error)
    }
  }
  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>

      <Button
        title='Sign Out'
        style={styles.button}
        onPress={() => signOut(auth)}
      />

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
      <Button
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
            <Input value={newName} onChangeText={setNewName} />
            {/* <Button onPress={() => handleNameChange(newName)} /> */}
            <Button onPress={() => handleNameChange(newName)} />
          </View>
        </View>
      </Modal>
      <Button
        title={live ? 'Go offline' : 'Go LIVE!'}
        style={styles.button}
        onPress={handleGoLive}
      />
      <Text>
        {live ? (
          <Icon name='circle' color='green' />
        ) : (
          <Icon name='circle' color='red' />
        )}
        {live && 'Live Since:'}
        {live ? (
          userInfo && userInfo.lastActiveTime ? (
            <Text style={{ marginLeft: '10%', marginBottom: '20%' }}>
              {formatTimestamp(userInfo.lastActiveTime)}
            </Text>
          ) : (
            'Not available'
          )
        ) : (
          'Not live!'
        )}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '80%',
    height: '50%',
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
    padding: 35,
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
})
