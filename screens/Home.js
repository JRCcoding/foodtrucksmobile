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
import { StyleSheet, Text, View } from 'react-native'
import { Button } from 'react-native-elements'
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

  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>

      <Button
        title='Sign Out'
        style={styles.button}
        onPress={() => signOut(auth)}
      />

      {refreshing ? (
        <Text>Refreshing...</Text>
      ) : (
        <Button title='Refresh' style={styles.button} onPress={handleRefresh} />
      )}

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
          <Marker
            coordinate={{
              latitude: lat,
              longitude: long,
            }}
            title='Your Food Truck'
          />
        </MapView>
      ) : (
        <Text>Loading...</Text>
      )}
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
})
