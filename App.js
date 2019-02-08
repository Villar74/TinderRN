import React from 'react';
import { RootStack } from './js/router';
import { createAppContainer } from 'react-navigation';

const AppContainer = createAppContainer(RootStack);

// Now AppContainer is the main component for React to render

export default AppContainer;
