import { Slide } from './SlideItem';

/**
 * Données des slides d'onboarding
 */
const SLIDES_DATA: Slide[] = [
  {
    id: '1',
    title: 'Bienvenue sur Fish It',
    description: 'Votre compagnon de pêche idéal pour découvrir et explorer les meilleurs spots.',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '2',
    title: 'Localisation',
    description: 'Cette application utilise votre position pour vous montrer les meilleurs spots de pêche à proximité et vous fournir des informations en temps réel.',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '3',
    title: 'Prêt à commencer ?',
    description: 'Rejoignez notre communauté de pêcheurs et améliorez votre expérience de pêche dès aujourd\'hui !',
    image: require('../../assets/images/icon.png'),
    showButton: true
  },
];

export default SLIDES_DATA;