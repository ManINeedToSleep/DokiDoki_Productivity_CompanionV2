import { CompanionId } from '@/lib/firebase/companion';

// Get character-specific colors for polka dots
export const getCharacterDotColor = (id: CompanionId) => {
  switch (id) {
    case 'sayori':
      return '#F5C0DF';
    case 'natsuki':
      return '#FFCCD3';
    case 'yuri':
      return '#D1CFFF';
    case 'monika':
      return '#C5E8D1';
    default:
      return '#F5C0DF';
  }
};

// Get character-specific colors
export const getCharacterColors = (id: CompanionId) => {
  switch (id) {
    case 'sayori':
      return { 
        primary: '#FF9ED2',
        secondary: '#FFEEF3',
        text: '#D76C95',
        heading: '#FF9ED2',
        progress: '#FF9ED2'
      };
    case 'natsuki':
      return { 
        primary: '#FF8DA1',
        secondary: '#FFF0F0',
        text: '#D14D61',
        heading: '#FF8DA1',
        progress: '#FF8DA1'
      };
    case 'yuri':
      return { 
        primary: '#A49EFF',
        secondary: '#F0F0FF',
        text: '#6A61E0',
        heading: '#A49EFF',
        progress: '#A49EFF'
      };
    case 'monika':
      return { 
        primary: '#85CD9E',
        secondary: '#F0FFF5',
        text: '#4A9B68',
        heading: '#85CD9E',
        progress: '#85CD9E'
      };
    default:
      return { 
        primary: '#FF9ED2',
        secondary: '#FFEEF3',
        text: '#D76C95',
        heading: '#FF9ED2',
        progress: '#FF9ED2'
      };
  }
};

// Get character-specific colors for input elements
export const getInputColors = (id: CompanionId) => {
  switch (id) {
    case 'sayori':
      return { 
        bg: '#FFF5F9',
        border: '#FFD1E6',
        focus: '#FF9ED2',
        placeholder: '#FFAED9'
      };
    case 'natsuki':
      return { 
        bg: '#FFF5F5',
        border: '#FFCCD5',
        focus: '#FF8DA1',
        placeholder: '#FFA5B5'
      };
    case 'yuri':
      return { 
        bg: '#F5F5FF',
        border: '#D1D0FF',
        focus: '#A49EFF',
        placeholder: '#B8B5FF'
      };
    case 'monika':
      return { 
        bg: '#F5FFF8',
        border: '#C5E8D1',
        focus: '#85CD9E',
        placeholder: '#A0DCB4'
      };
    default:
      return { 
        bg: '#FFF5F9',
        border: '#FFD1E6',
        focus: '#FF9ED2',
        placeholder: '#FFAED9'
      };
  }
}; 