import React, { Component } from "react";
import { StyleSheet, Text, View, AsyncStorage } from "react-native";
import SwipeCards from "react-native-swipe-cards";
import ImageBrowser from "react-native-interactive-image-gallery";
import consts from "../consts";

/**
 *   список лайкнутых картинок
 */
export default class List extends Component {
  static navigationOptions = ({ navigation }) => {
    const { params = {} } = navigation.state;
    return {
      title: "My images",
      headerStyle: {
        backgroundColor: "#fff"
      },
      headerTitleStyle: {
        textAlign: "center",
        alignSelf: "center",
        width: "80%"
      }
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      saved: []
    };
  }

  componentDidMount() {
    AsyncStorage.getItem(consts.savedImages).then(data => {
      if (data !== null) this.setState({ saved: JSON.parse(data) });
    });
  }

  render() {
    if (this.state.saved.length > 0) {
      const imageURLs: Array<Object> = this.state.saved.map(
        (img: Object, index: number) => ({
          URI: img.URI,
          thumbnail: img.thumbnail,
          id: String(index),
          description: img.description
        })
      );

      return <ImageBrowser images={imageURLs} />;
    } else {
      return (
        <View style={styles.container}>
          <Text style={{ paddingTop: 16, fontSize: 20 }}>No images saved</Text>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7"
  }
});
