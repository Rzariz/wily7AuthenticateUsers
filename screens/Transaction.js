import React from 'react';
import { ToastAndroid, StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase'
import db from '../config'
import {SafeAreaProvider} from 'react-native-safe-area-context'


export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookId: '',
      scannedStudentId: '',
      transactionMessage: ''
    }
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
    this.setState({

      hasCameraPermissions: status === "granted",
      //buttonState: 'clicked',
      buttonState: id,
      scanned: false,
      // scannedData: 'scanned data is here'
    });
    //console.log(this.state.hasCameraPermissions)
  }

  handleBarCodeScanned = async ({ type, data }) => {
    // this.setState({
    //   scanned: true,
    //   scannedData: data,
    //   buttonState: 'normal'
    // });
    const { buttonState } = this.state //.buttonState
    if (buttonState === "BookId") {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
      });
    }
    else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
      });
    }
  }
  handleTransaction = async () => {
    //verify if the student is eligible for book issue or return or none


    var transactionType = await this.checkBookAvailability();
    if (!transactionType) {
      alert("Book does not exist in library db")
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      })
    }
    else if (transactionType === 'Issue') {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if (isStudentEligible) {
        this.initiateBookIssue();
        alert("Book Issued")
      }
    }
    else if (transactionType === 'Return'){
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      console.log(isStudentEligible)
      if (isStudentEligible) {
        this.initiateBookReturn();
        alert("Book returned")
      }
    }

    // var transactionMessage = null;
    // db.collection('books').doc(this.state.scannedBookId).get()

    //   .then((doc) => {
    //     // console.log(doc.data())
    //     var book = doc.data();
    //     if (book.bookAvailability) {
    //       this.initiateBookIssue();
    //       transactionMessage = "Book Issued"
    //       ToastAndroid.show(transactionMessage , ToastAndroid.SHORT)
    //     }
    //     else {
    //       this.initiateBookReturn();
    //       transactionMessage = "Book returned";
    //       ToastAndroid.show(transactionMessage , ToastAndroid.SHORT)
    //     }
    //   })
    // this.setState({
    //   transactionMessage: transactionMessage
    // })
  }
  checkStudentEligibilityForBookIssue = async () => {

    const studentRef = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get();

    var isStudentEligible = "";
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: "",
        scannedBookId: ""
      });
      isStudentEligible = false;
      alert("No such student")
    }
    else {
      studentRef.docs.map(doc => {
        var student = doc.data();
        if (student.noOfBooksIssued < 2) {
          isStudentEligible = true;
        }
        else {
          isStudentEligible = false;
          alert("Already student issued 2 books")
          this.setState({
            scannedBookId: "",
            scannedStudentId: ""
          })
        }
      })
    }
    return isStudentEligible;
  }


  checkStudentEligibilityForBookReturn = async () => {
    const transactionRef = await db.collection("transaction").where("bookId", "==", this.state.scannedBookId).limit(1).get();
    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastbooktransaction = doc.data();
      if (lastbooktransaction.studentId === this.state.scannedStudentId) {
        isStudentEligible = true;
      }
      else {
        isStudentEligible = false;
        alert("book was not issued by this student")
        this.setState({
          scannedBookId: "",
          scannedStudentId: ""
        })
      }
    })
    return isStudentEligible;
  }


  checkBookAvailability = async () => {
    const bookref = await db.collection("books").where("bookId", '==', this.state.scannedBookId).get();

    var transactionType = "";
    if (bookref.docs.length == 0) {
      transactionType = false;
    }
    else {
      bookref.docs.map(doc => {
        var book = doc.data();
        if (book.bookAvailability) {
          transactionType = "Issue"
        }
        else {
          transactionType = "Return"
        }
      })
    }

    return transactionType;
  }
  initiateBookIssue = async () => {
    // Add a transaction
    db.collection('transaction').add({
      'studentId': this.state.scannedStudentId,
      'bookId': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': 'Issue'
    })

    //change book status 
    db.collection('books').doc(this.state.scannedBookId).update({
      'bookAvailability': false

    })

    ////change number of issued books for student
    db.collection('students').doc(this.state.scannedStudentId).update({
      'noOfBooksIssued': firebase.firestore.FieldValue.increment(1)
    })

    //Alert.alert("Book Issued")

    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  initiateBookReturn = async () => {
    db.collection('transaction').add({
      'studentId': this.state.scannedStudentId,
      'bookId': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': 'Return'
    })

    //change book status 
    db.collection('books').doc(this.state.scannedBookId).update({
      'bookAvailability': true
    })

    ////change number of issued books for student
    db.collection('students').doc(this.state.scannedStudentId).update({
      'noOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
    })

    //Alert.alert("Book Returned")

    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal") {
      return (
        
        <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>

          <View style={styles.container}>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 100, height: 100 }} />
            <View style={styles.inputView}>
              <TextInput placeholder="book id"
                style={styles.inputBox}


                onChangeText={(text) => {
                  this.setState({
                    scannedBookId: text
                  })
                }}
                value={this.state.scannedBookId}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => this.getCameraPermissions("BookId")}>
                <Text style={styles.buttonText}>Scan</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.inputView}>
              <TextInput placeholder="student id" style={styles.inputBox}

                onChangeText={(text) => {
                  this.setState({
                    scannedStudentId: text
                  })
                }}
                value={this.state.scannedStudentId} />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => this.getCameraPermissions("StudentId")}>
                <Text style={styles.buttonText}>Scan</Text>
              </TouchableOpacity>
            </View>


            <TouchableOpacity style={styles.submitButton}
              onPress={async () => {
                await this.handleTransaction()
              }}>
              <Text style={styles.submitButtonText}> SUBMIT </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView: {
    flexDirection: 'row',
    margin: 20
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
    borderRadius: 10
  },
  scanButton: {
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderRadius: 10
  },
  submitButton: {
    backgroundColor: '#FBC02D',
    width: 170,
    height: 40,
    borderRadius: 10
  },
  submitButtonText: {
    padding: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: "bold",
    color: 'white'
  }
});