import { UPDATE_LANGUAGE } from '@lib';

const initialState = {
  language: 'en',
};

export default function language(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_LANGUAGE:
      localStorage.setItem('language', action.data);
      return { language: action.data };
    default:
      return state;
  }
}
