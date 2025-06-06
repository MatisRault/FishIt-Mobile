import { Text as DefaultText, View as DefaultView } from 'react-native';

type TextProps = DefaultText['props'];
type ViewProps = DefaultView['props'];

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const color = '#204553'; // Couleur de texte par défaut forcée (bleu foncé lisible)

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = '#ECF3FA'; // Fond forcé pour tout

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
