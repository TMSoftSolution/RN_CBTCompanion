import React, { Component, Fragment } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import Icon from '../../common/icons';
import { Auth, Storage, Logger } from 'aws-amplify';
import { NavigationActions } from 'react-navigation';
import PhoneInput from 'react-native-phone-input';
import validator from 'validator';
import Header from '../../components/Header';
import ImagePicker from 'react-native-image-picker';
import { withStore } from '../../utils/StoreUtils';
import { showMessage } from 'react-native-flash-message';
import { errorMessage } from '../../utils';
import { recordScreenEvent, screenNames } from '../../utils/AnalyticsUtils';
import { requestCameraPermission } from '../../utils/PermissionUtils';
import ThemeStyle from '../../styles/ThemeStyle';
import Button from '../../components/Button';
import { Alert } from 'react-native';
import TextStyles from '../../common/TextStyles';
import qs from "qs";
import config from "./config.js";

const screenWidth = Dimensions.get('window').width;

function OAuth(client_id, cb) {
  Linking.addEventListener("url", handleUrl);
  function handleUrl(event) {
    console.log(event.url);
    Linking.removeEventListener("url", handleUrl);
    const [, query_string] = event.url.match(/\#(.*)/);
    console.log(query_string);
    const query = qs.parse(query_string);
    console.log(`query: ${JSON.stringify(query)}`);
    cb(query.access_token);
    
  }
  const oauthurl = `https://www.fitbit.com/oauth2/authorize?${qs.stringify({
    client_id,
    response_type: "token",
    scope: "heartrate activity activity profile sleep",
    redirect_uri: "CBTCompanion://fit",
    expires_in: "31536000"
  })}`;
  console.log(oauthurl);
  Linking.openURL(oauthurl).catch(err =>
    console.error("Error processing linking", err)
  );
}

class DeviceListSceen extends Component {
  constructor(props) {
    super(props);
    this.OAuth;
    this.state = {
      isApple: false,
      isFitbit: false,
      isGoogleFit: false,
      token: ''
    };
  }

  goack = () => this.props.navigation.dispatch(NavigationActions.back());

  clickedDevice(val) {
    if (val === "google_fit") {
      this.setState({
        isApple: false,
        isFitbit: false,
        isGoogleFit: true,
      });
    } else if (val === "fitbit") {
      OAuth(config.client_id, (access_token) => {
        fetch("https://api.fitbit.com/1.2/user/-/sleep/date/2017-06-27.json", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          }
          // body: `root=auto&path=${Math.random()}`
        })
          .then(res => res.json())
          .then(res => {
            console.log(`res: ${JSON.stringify(res)}`);
            this.setState({
              isApple: false,
              isFitbit: true,
              isGoogleFit: false,
              token: access_token
            })
          })
          .catch(err => {
            console.error("Error: ", err);
          });
      })
    } else {
      this.setState({
        isApple: true,
        isFitbit: false,
        isGoogleFit: false,
      });
    }
  }

  render() {
    const { isApple, isFitbit, isGoogleFit } = this.state;
    return (
      <View style={ThemeStyle.pageContainer}>
        <Header
          title="Devices"
          rightIcon={() => (
            <View
              style={{ position: 'relative', top: 1, flexDirection: 'row' }}
            >
              <TouchableOpacity
                style={{ marginLeft: 8, marginTop: 3 }}
                onPress={() => {
                  this.setState({
                    showInstructions: true,
                    instructions: this.exerciseData.instructions,
                  });
                }}
              >
                <Icon
                  family={'EvilIcons'}
                  name={'question'}
                  color="black"
                  size={25}
                />
              </TouchableOpacity>
            </View>
          )}
          goBack={() => this.props.navigation.goBack(null)}
        />
        <View style={styles.mainView}>
          <TouchableOpacity onPress={() => this.clickedDevice("health")}>
            <View style={isApple ? styles.clickedView:styles.unClickedView}>
              <Image source={require('../../assets/images/redesign/applehealth_logo.png')} style={styles.iconImg}/>
              <Text style={isApple ? styles.clickedTxt : styles.unClickedTxt}>Apple Health</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.clickedDevice("fitbit")}>
            <View style={isFitbit ? styles.clickedView:styles.unClickedView}>
              <Image source={require('../../assets/images/redesign/fitbit_logo.png')} style={styles.iconImg}/>
              <Text style={isFitbit ? styles.clickedTxt : styles.unClickedTxt}>Fitbit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.clickedDevice("google_fit")}>
            <View
              style={isGoogleFit ? styles.clickedView : styles.unClickedView}
            >
              <Image source={require('../../assets/images/redesign/googlefit_logo.png')} style={styles.iconImg}/>
              <Text
                style={isGoogleFit ? styles.clickedTxt : styles.unClickedTxt}
              >
                Google Fit
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Text 
          style={{
            marginTop: 50,
            marginHorizontal: 25
          }}
        >
        token: {this.state.token}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainView: {
    margin: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clickedView: {
    width: (screenWidth -  20) / 3 - 15,
    height: (screenWidth - 20) / 3 - 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "blue",
  },
  unClickedView: {
    width: (screenWidth -  20) / 3 - 15,
    height: (screenWidth - 20) / 3 - 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  clickedTxt: {
    marginTop: 10,
    color: "blue",
    fontSize: 16,
  },
  unClickedTxt: {
    marginTop: 10,
    color: "black",
    fontSize: 16,
  },
  iconImg: {
    width: 30,
    height: 30,
    resizeMode: 'contain'
  }
});

export default withStore(DeviceListSceen);