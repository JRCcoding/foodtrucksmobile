import { useNavigation } from '@react-navigation/native'
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
import { Button, Icon } from 'react-native-elements'
import MapView, { Marker } from 'react-native-maps'
import { useAuthentication } from '../utils/hooks/useAuthentication'

export default function Home() {
  const [location, setLocation] = useState(null)
  const [lat, setLat] = useState(null)
  const [long, setLong] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthentication()
  const auth = getAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [allLive, setAllLive] = useState()
  const [modalVisible, setModalVisible] = useState(false)

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
  const db = getFirestore()

  useEffect(() => {
    if (user && lat && long) {
      // const updateFirebaseLocation = async (userId, latitude, longitude) => {
      //   console.log('Current user in updateFirebaseLocation:', user)
      //   console.log('Current user uid in updateFirebaseLocation:', user?.uid)

      //   const userRef = doc(db, 'users', userId)
      //   console.log(user.uid)

      //   try {
      //     await updateDoc(userRef, {
      //       location: {
      //         latitude,
      //         longitude,
      //       },
      //     })
      //     console.log('User location updated successfully!')
      //   } catch (error) {
      //     console.error('Error updating user location:', error)
      //   }
      // }

      // updateFirebaseLocation(user.uid, lat, long)

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
            })

            //Throw in to check and see if user is owner
            const userData = userDoc.data()
            const owner = userData.owner
            setOwnerStatus(owner)

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
    const handleAllLive = async () => {
      const usersCollectionRef = collection(db, 'users')
      // const q = query(usersCollectionRef, where('owner', '==', true))
      const q = query(usersCollectionRef, where('live', '==', true))
      try {
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userDocs = querySnapshot.docs
          const liveTrucks = userDocs.map((doc) => ({
            location: doc.data().location,
            truckName: doc.data().truckName,
            lastActiveTime: doc.data().lastActiveTime,
          }))

          setAllLive(liveTrucks)
          console.log(allLive)
          console.log('User location updated successfully!')
        } else {
          console.log('User not found with the specified uid.')
        }
      } catch (error) {
        console.error('Error updating user location:', error)
      }
    }

    handleAllLive()
  }, [])

  const [ownerStatus, setOwnerStatus] = useState(null)
  const navigation = useNavigation()

  useEffect(() => {
    if (ownerStatus === true) {
      navigation.navigate('Dashboard')
    }
  }, [ownerStatus, navigation])

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
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: lat,
              longitude: long,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {allLive?.map((marker, index) => (
              <Marker
                key={marker.truckName}
                coordinate={{
                  latitude: marker.location.latitude,
                  longitude: marker.location.longitude,
                }}
                title={marker.truckName}
              />
            ))}
          </MapView>
          <Button
            title='Nearby Food Trucks'
            style={styles.button}
            onPress={() => setModalVisible(!modalVisible)}
          />
        </>
      ) : (
        <View>
          <Button
            title='Load Map'
            style={styles.button}
            onPress={handleRefresh}
          />
        </View>
      )}
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
            <View>
              {allLive?.map((truck, index) => (
                <>
                  <Text key={index} style={styles.truckNames}>
                    {' '}
                    {/* <Icon name='circle' /> */}
                    {truck.truckName}
                  </Text>
                  <Text style={{ marginLeft: '10%', marginBottom: '20%' }}>
                    Live since: {formatTimestamp(truck.lastActiveTime)}
                  </Text>
                </>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  map: {
    width: '80%',
    height: '50%',
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
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  truckNames: {
    fontSize: 25,
    fontWeight: 'bold',
  },
})
