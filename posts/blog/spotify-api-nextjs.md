---
title: Using the Spotify API with Next.js
subtitle: In this post, I will share a tutorial on getting the top tracks and currently playing on Spotify using the Next.js API.
timestamp: Saturday, July 30 2022
thumb:
tags:
  - "Spotify"
  - "Tutorial"
  - "Next.js API"
featured: true
order: 1
---

In this post, I will share a tutorial on getting the top tracks and currently playing on [Spotify](https://www.spotify.com/), using the [Next.js](https://nextjs.org/) API. For example, you can see the [dashboard](/dashboard) page.

## Creating a Spotify App

We need to do this to get the credentials that will be used to authenticate the API.

- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and log in to your account.
- Click "**Create an App**".
- Fill in the name and description then click "**Create**".
- Click "**Show Client Secret**".
- Save Client ID and Secret to `.env` file.
- Click "**Edit Settings**".
- Add `http://localhost:3000` to redirect URIs.

## Authentication

We need to get the authorization `code` by doing a _request_ via a URL filled with the required parameters.

Please copy the URL below. Change `client_id` and `scope` as you like. Since in this tutorial we only want to read the top track and the currently playing, we only need _scope_ **user-top-read** and **user-read-currently-playing**, you can read more about scope [here](https://developer.spotify.com/documentation/general/guides/authorization/scopes/).

```
https://accounts.spotify.com/id/authorize?
client_id=9b11ebc6d65840eebb0db51c15b211eb&response_type=code&
redirect_uri=http://localhost:3000/&scope=user-top-read%20user-read-currently-playing
```

After authorization, you will be redirected to your `redirect_uri` earlier. In the URL, there is a `code` query parameter. Save that value.

```
http://localhost:3000/?code=AQCaXamT6nbRDghdG...dyRPlQ
```

Next, we need a `refresh_token`. You have to generate a Base 64 encoded string containing the client ID and secret from earlier. You can use [this tool](https://www.base64encode.org/) to encode it. The format should be `client_id:client_secret`.

```bash
curl -H "Authorization: Basic <base64 encoded client_id:client_secret>" -d grant_type=authorization_code -d code=<code> -d redirect_uri=http://localhost:3000/ https://accounts.spotify.com/api/token
```

Change the command above according to your data. If so, it should be like this. _(some of my data will be disguised)_

```bash
curl -H "Authorization: Basic OWIxMWViYzZkN...UyZDYwZGI=" -d grant_type=authorization_code -d code=AQCaXamT6nbRDghdG...dyRPlQ -d redirect_uri=http://localhost:3000/ https://accounts.spotify.com/api/token
```

After doing POST request, you will receive a JSON as below.

```json
{
  "access_token": "BQCr_Gc6LyFHnu3R0dC...uOU2xXYLs",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQDB5wwm...g9tTcaqKc",
  "scope": "user-read-currently-playing user-top-read"
}
```

## Using the Spotify API

We have managed to get all the necessary data. Next, create a `.env.local` file and fill it with the values you got earlier.

```env
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

We have to request `access_token` using the client ID, client secret, and refresh_token we got earlier.

```js
// lib/spotify.js

import qs from "query-string";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  return response.json();
};
```

We will use this `access_token` to request top tracks. I assume you entered the `user-top-read` scope in the scope section earlier.

```js
// lib/spotify.js

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

export const getTopTracks = async () => {
  const { access_token } = await getAccessToken();
  const url = qs.stringifyUrl({
    url: TOP_TRACKS_ENDPOINT,
    query: {
      time_range: "short_term",
    },
  });

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
```

In the above code, there is a query `time_range`, because I want to get the top track for the past 4 weeks, so I added `short_term`, you can read about `time_range` [here](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-users-top-artists-and-tracks).

## Creating API endpoints

First you have to create a new file in `pages/api/spotify/top-tracks.js`. Then import the `getTopTracks` function that we created earlier.

```js
// pages/api/spotify/top-tracks.js

import { getTopTracks } from "../../lib/spotify";

export default async (_, res) => {
  const response = await getTopTracks();
  const { items } = await response.json();

  const tracks = items.slice(0, 10).map((track) => ({
    album: track.album.name,
    albumImageUrl: track.album.images[0].url,
    artist: track.artists.map((_artist) => _artist.name).join(", "),
    title: track.name,
    duration: track.duration_ms,
    songUrl: track.external_urls.spotify,
  }));

  return res.status(200).json({ tracks });
};
```

This will give you the top 10 songs that you play most frequently. You can change the code above as you wish. If you have done all the things above, you will get data like below.

```json
{
  "tracks": [
    {
      "album": "Celebrate",
      "albumImageUrl": "https://i.scdn.co/image/ab67616d0000b273c5b34e22c26ee36af18aa30b",
      "artist": "TWICE",
      "title": "Celebrate",
      "duration": 188433,
      "songUrl": "https://open.spotify.com/track/5ZwlnR8yGofZ0669mEh8Xm"
    },
    {
      "album": "Dawn FM",
      "albumImageUrl": "https://i.scdn.co/image/ab67616d0000b2734ab2520c2c77a1d66b9ee21d",
      "artist": "The Weeknd",
      "title": "Sacrifice",
      "duration": 188918,
      "songUrl": "https://open.spotify.com/track/1nH2PkJL1XoUq8oE6tBZoU"
    },
    {
      "album": "井上陽水トリビュート",
      "albumImageUrl": "https://i.scdn.co/image/ab67616d0000b2733a7b98fc91b7cf4b31f0852b",
      "artist": "ヨルシカ",
      "title": "Make-up Shadow",
      "duration": 237733,
      "songUrl": "https://open.spotify.com/track/0ddW75PWqkWQxDOtKLmoQC"
    }
    // ...........
  ]
}
```

## Example

You can see an example of its implementation in [dashboard](/dashboard). For the code, see [here](https://github.com/dhafitf/dhafit/blob/master/lib/spotify.ts). In the repository, there is also a code to display the currently playing song.
