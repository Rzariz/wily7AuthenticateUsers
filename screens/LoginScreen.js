import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView } from 'react-native';
// import * as firebase from 'firebase'
import firebase from 'firebase/app'

export default class LoginScreen extends React.Component {
    constructor() {
        super();
        this.state = {
            emailId: '',
            password: ''
        }
    }

    login = async(email, password) => {
        if (email && password) {
            try {
                console.log("test1")
                const response = await firebase.auth().signInWithEmailAndPassword(email, password)
                console.log(response)
                if (response) {
                    console.log("test2")
                    this.props.navigation.navigate('Transaction')
                }
            }
            catch (error) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        alert('User does not exists');
                        break;
                    case 'auth/invalid-email':
                        alert("Incorrect email or passsword")
                        break;
                }
            }
        }
        else {
            alert('enter email and password');
        }
    }
    render() {
        return (
            <KeyboardAvoidingView>
                <View style={styles.container}>
                    <View>
                        <Image source={require("../assets/booklogo.jpg")}
                            style={{ width: 200, height: 200 }} />
                        <Text style={{ textAlign: 'center', fontSize: 30 }}>Wily</Text>
                    </View>
                    <View>
                        <TextInput
                            style={styles.loginBox}
                            placeholder="abc@example.com"
                            keyboardType="email-address"
                            onChangeText={(info) => {
                                this.setState({ emailId: info })
                            }} />

                        <TextInput
                            style={styles.loginBox}
                            secureTextEntry={true}
                            placeholder="enter Password"
                            onChangeText={(text) => {
                                this.setState({
                                    password: text
                                })
                            }}
                        />
                    </View>

                    <View>
                        <TouchableOpacity
                            style={{ height: 30, width: 90, borderWidth: 1, marginTop: 20, paddingTop: 5, borderRadius: 7 }}
                            onPress={() => { this.login(this.state.emailId, this.state.password) }}>
                            <Text style={{ textAlign: 'center' }}> LOGIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

        )
    }

}

const styles = StyleSheet.create({
    container: {

        backgroundColor: '#e3fdfd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginBox:
    {
        width: 300,
        height: 40,
        borderWidth: 1.5, borderRadius: 10,
        fontSize: 20,
        margin: 10,
        paddingLeft: 10
    }
})