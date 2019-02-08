import { createStackNavigator } from "react-navigation";

import MainScreen from "../screens/MainScreen";
import List from "../screens/List";

/**
 * Routes
 */
export const RootStack = createStackNavigator(
  {
    MainScreen: {
      screen: MainScreen
    },
    List: {
      screen: List
    }
  },
  {
    initialRouteName: "MainScreen"
  }
);
