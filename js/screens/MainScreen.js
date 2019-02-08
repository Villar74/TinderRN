import React, { Component } from "react";
import {
  StyleSheet,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
  Image,
  AsyncStorage
} from "react-native";
import SwipeCards from "react-native-swipe-cards";
import Iconz from "react-native-vector-icons/Ionicons";
import Api from "../api/Api";
import consts from "../consts";

/**
 *   Главный экран приложения
 */
export default class Home extends Component {
  //Настраиваем header
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      headerLeft: (
        <TouchableOpacity onPress={() => params.handleUndo()}>
          <Text
            style={{
              color: navigation.getParam("undoColor"),
              paddingLeft: 16,
              fontSize: 16,
              paddingTop: 2
            }}
          >
            {"Undo"}
          </Text>
        </TouchableOpacity>
      ),
      headerTitle: (
        <Text style={{ fontSize: 18, color: "#000", paddingLeft: "35%" }}>
          My Mars
        </Text>
      ),
      headerRight: (
        <Iconz
          name="ios-heart-empty"
          size={26}
          color="#800"
          style={{ paddingRight: 16 }}
          onPress={() => navigation.navigate("List")}
        />
      ),
      headerStyle: {
        backgroundColor: "#fff",
        elevation: 0
      }
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      cards: [], //массив с карточками
      count: 0, //счетчик карточек
      loading: true, //индикация загрузки
      disabled: false, //включение кнопок лайк\дизлайк, сделано потому что слишком частые нажатия приводят к неправильному поведению
      saved: [], //лайкнутые
      lastLiked: false, //флаг для определения лайкнут ли последний пост, чтобы при нажатии на возврат удалять последний или нет из памяти
      undoed: true //для того чтобы кнопка Undo срабатывала 1 раз
    };
    //счетчик для страниц (если захочется добавить подгрузку)
    this.albumId = 1;
  }

  componentDidMount() {
    this.loadImages(this.albumId);
    //таким образом реализуем кнопку в header который static
    this.props.navigation.setParams({
      handleUndo: () => {
        if (this.state.count < this.state.cards.length && !this.state.undoed) {
          this.state.lastLiked &&
            AsyncStorage.getItem(consts.savedImages).then(data => {
              if (data !== null) {
                let arr = JSON.parse(data);
                arr.splice(-1, 1);
                this.setState({ saved: arr });
                AsyncStorage.setItem(consts.savedImages, JSON.stringify(arr));
              }
            });
          this.swiper._goToPrevCard();
          this.setState({ count: this.state.count + 1, undoed: true });
          //выставляем цвет для Undo
          this.props.navigation.setParams({
            undoColor: "#000"
          });
        }
      }
    });
    //Получаем текущий список лайнкутых фоток, для того чтобы каждый раз не делать это при сохранении нового лайка
    AsyncStorage.getItem(consts.savedImages).then(data => {
      if (data !== null) this.setState({ saved: JSON.parse(data) });
    });
  }

  //Загрузка картинок
  loadImages(albumId) {
    Api.getImages(albumId)
      .then(cards => {
        this.setState({
          cards: this.state.cards.concat(cards),
          count: cards.length,
          loading: false
        });
      })
      .catch(data => {
        this.setState({ loading: false });
        console.log(data);
      });
  }

  //рендер карточек
  Card(x) {
    return (
      <View style={styles.card}>
        <ImageBackground
          source={{
            uri: x["url"]
          }}
          resizeMode="cover"
          imageStyle={{ height: consts.cardHeight, borderRadius: 10 }}
          style={{ height: consts.cardHeight }}
        >
          <View
            style={{
              width: consts.cardWidth,
              height: 70,
              alignItems: "flex-start",
              justifyContent: "space-between"
            }}
          >
            <View style={{ marginLeft: 15, marginTop: 25 }}>
              <Text style={{ fontSize: 20, fontWeight: "300", color: "#444" }}>
                {x["title"]}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }
  //свайп вправо
  handleYup(card) {
    this.saveCard(card);
  }

  //свайп влево
  handleNope(card) {
    this.setState({ lastLiked: false });
    this.updateUndo();
  }

  //сохраняем в память
  saveCard(card) {
    let item = [
      {
        id: card["id"],
        URI: card["url"],
        thumbnail: card["thumbnailUrl"],
        description: card["title"]
      }
    ];
    let newArr = this.state.saved.concat(item);
    this.setState({ saved: newArr, lastLiked: true });
    AsyncStorage.setItem(consts.savedImages, JSON.stringify(newArr));
    this.updateUndo();
  }

  //включаем кнопку возврата и красим
  updateUndo() {
    this.setState({ undoed: false });
    this.props.navigation.setParams({
      undoColor: "#a00"
    });
  }

  //рендер отсутствия карточек или загрузки (нужно доработать разные варианты)
  noMore() {
    return (
      <View style={styles.container}>
        <Image
          source={{
            uri:
              "https://www.honeypot2night.com/wp-content/uploads/2018/04/ajax-loading-gif.gif" //просто гифка с загрузкой
          }}
          style={{ height: 420, width: 300 }}
        />
        <View />
      </View>
    );
  }

  //обработка лайка
  yup() {
    if (this.state.count < 1) {
      this.saveCard(this.swiper.getCurrentCard());
      this.setState({ disabled: true });
      this.updateUndo();
      setTimeout(() => {
        this.setState({ disabled: false });
      }, 1000);
      this.swiper._forceRightSwipe();
    }
  }

  //обработка дизлайка
  nope() {
    if (this.state.count < 0) {
      this.setState({ disabled: true, lastLiked: false });
      this.updateUndo();
      setTimeout(() => {
        this.setState({ disabled: false });
      }, 1000);
      this.swiper._forceLeftSwipe();
    }
  }

  //вычитаем количество карточек, и тут можно добавить подгрузку
  cardRemoved(index) {
    console.log(`The index is ${index}`);
    this.setState({ count: this.state.cards.length - index - 1 });
    let CARD_REFRESH_LIMIT = 3;

    if (this.state.cards.length - index <= CARD_REFRESH_LIMIT + 1) {
      console.log(
        `There are only ${this.state.cards.length - index - 1} cards left.`
      );

      if (!this.state.outOfCards) {
        console.log(`Adding  more cards`);
        //this.loadImages(this.albumId++);
      }
    }
  }

  render() {
    let opacity = !this.state.disabled ? 1 : 0.7; //прозрачность кнопок
    //рендер кнопок и счетчика
    let footer = this.state.loading ? (
      <Text style={{ alignSelf: "center", paddingBottom: 16 }}>
        Downloading
      </Text>
    ) : (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-around",
          paddingBottom: 20
        }}
      >
        <TouchableOpacity
          style={[
            styles.buttons,
            {
              backgroundColor: "#000",
              opacity: opacity,
              marginLeft: 40
            }
          ]}
          disabled={this.state.disabled}
          onPress={() => this.nope()}
        >
          <Iconz name="ios-close" size={35} color="#888" />
        </TouchableOpacity>
        <Text>{this.state.count} cards</Text>
        <TouchableOpacity
          style={[
            styles.buttons,
            {
              backgroundColor: "#800",
              opacity: opacity,
              marginRight: 40
            }
          ]}
          disabled={this.state.disabled}
          onPress={() => this.yup()}
        >
          <Iconz
            name="ios-heart-empty"
            size={26}
            color="#888"
            style={{ marginTop: 5 }}
          />
        </TouchableOpacity>
      </View>
    );
    return (
      <View style={styles.container}>
        <SwipeCards
          ref={data => {
            this.swiper = data;
          }}
          loop={false}
          cards={this.state.cards}
          showYup={false}
          showNope={false}
          containerStyle={{
            backgroundColor: "#f7f7f7",
            alignItems: "center",
            margin: 20
          }}
          renderCard={cardData => this.Card(cardData)}
          renderNoMoreCards={() => this.noMore()}
          handleYup={card => this.handleYup(card)}
          handleNope={() => this.handleNope()}
          cardRemoved={this.cardRemoved.bind(this)}
        />
        <View>{footer}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "#fff"
  },
  buttons: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 100
  },
  card: {
    flex: 1,
    alignItems: "center",
    alignSelf: "center",
    width: consts.cardWidth,
    height: consts.cardHeight
  }
});
