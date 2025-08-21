import { Href, Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import React, { type ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props): React.ReactElement {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={(event) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          void openBrowserAsync(href);
        }
      }}
    />
  );
}
