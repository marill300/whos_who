import React, { useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import fetchFromSpotify, { request } from "../services/api";
import Game from "./Game";
import Landing from "./Landing";
import GameOver from "./GameOver";

const AUTH_ENDPOINT =
	"https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

const App = () => {
	const [token, setToken] = useState(null);
	const [genres, setGenres] = useState([]);
	const [authLoading, setAuthLoading] = useState(false);
	const [configLoading, setConfigLoading] = useState(false);
	const [config, setConfig] = useState({
		selectedGenre: "electronic",
		numSongs: 1,
		numArtists: 2
	});

	useEffect(() => {
		const data = window.localStorage.getItem("WHOSWHO_CONFIG_STATE");
		if (data !== null) setConfig(JSON.parse(data));
	}, []);

	useEffect(() => {
		window.localStorage.setItem("WHOSWHO_CONFIG_STATE", JSON.stringify(config));
		console.log("config", config);
	}, [config]);

	// If this is removed, things break
	const loadGenres = async t => {
		setConfigLoading(true);
		const response = await fetchFromSpotify({
			token: t,
			endpoint: "recommendations/available-genre-seeds"
		});
		console.log(response);
		setGenres(response.genres);
		setConfigLoading(false);
	};

	useEffect(() => {
		setAuthLoading(true);
		const storedTokenString = localStorage.getItem(TOKEN_KEY);
		if (storedTokenString) {
			const storedToken = JSON.parse(storedTokenString);
			if (storedToken.expiration > Date.now()) {
				console.log("Token found in localstorage");
				setAuthLoading(false);
				setToken(storedToken.value);
				loadGenres(storedToken.value);
				return;
			}
		}
		console.log("Sending request to AWS endpoint");
		request(AUTH_ENDPOINT).then(({ access_token, expires_in }) => {
			const newToken = {
				value: access_token,
				expiration: Date.now() + (expires_in - 20) * 1000
			};
			localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
			setAuthLoading(false);
			setToken(newToken.value);
		});
	}, []);

	if (authLoading || configLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<Switch>
				<Route exact path="/">
					<Landing genres={genres} config={config} setConfig={setConfig} />
				</Route>
				<Route path="/play">
					<Game token={token} config={config} />
				</Route>
				<Route path="/gameover">
					<GameOver token={token} config={config} />
				</Route>
			</Switch>
		</div>
	);
};

export default App;
