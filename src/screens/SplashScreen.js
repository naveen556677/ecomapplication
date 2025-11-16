import { Image, Text, View } from "react-native"
import LottieView from "lottie-react-native"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import useStore from "../store/useStore"

export const SplashScreen = () => {
    const user = useStore((s) => s.user)
    const navigation = useNavigation()
    // useEffect(() => {
    //     const isSigned = async () => {
    //         let isSignIn = await GoogleSignin?.hasPreviousSignIn()
    //         return isSignIn
    //     }
    //     if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
    //         try {
    //             GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: true });
    //         } catch (err) {
    //             console.warn('GoogleSignin.configure failed', err);
    //         }
    //     }

    //     isSigned()?.then((signed) => {
    //         setTimeout(() => {
    //             !signed ? navigation?.replace('Login') : navigation.replace('Products')
    //         }, 3000)
    //     })?.catch((err) => {
    //         setTimeout(() => {
    //             navigation?.replace('Login')
    //         }, 3000)
    //     })
    // }, [])

    useEffect(() => {
        setTimeout(() => {
            !user ? navigation?.replace('Login') : navigation.replace('Products')
        }, 3000)
    }, [])

    return (
        <View style={{ flex: 1, backgroundColor: "white", justifyContent: "center", alignItems: "center" }} >
            <LottieView
                source={require("../assets/splash.json")}
                style={{ width: "90%", height: "100%" }}
                autoPlay
                loop
            />
            <Text style={{ position: "absolute", bottom: 30, fontWeight: 600, color: 'grey' }}>Developed By Naveen</Text>
        </View>
    )
}