# izichangepay

Zero-dependency TypeScript wrapper for the [IziChange](https://pay.izichange.com) payment API.

## Obtenir une clé API

1. Connectez-vous à votre [dashboard IziChange](https://pay.izichange.com/login)
2. Accédez à **Paramètres API** → **Information générale**
3. Cliquez sur **Ajouter** dans la section **Clé API**

![Création de la clé API](https://cryptogateway-project.github.io/cryptogateway-project/assets/images/key1.png)

4. Remplissez les champs selon vos besoins (nom, permissions)

![Formulaire de configuration](https://cryptogateway-project.github.io/cryptogateway-project/assets/images/key2.png)

5. Copiez et conservez en lieu sûr la clé générée (`apiKey`) et le secret (`secretKey`)

![Clé générée](https://cryptogateway-project.github.io/cryptogateway-project/assets/images/key4.png)

> **Important** : le `secretKey` n'est affiché qu'une seule fois. Ne le partagez jamais et ne le commitez pas dans votre dépôt.

## Configurer l'IPN (notifications instantanées)

L'IPN permet à IziChange de notifier votre serveur en temps réel à chaque transaction.

1. Depuis le dashboard, allez dans **Paramètres API** → **Information générale**
2. Localisez la section **Paramétrage IPN** et activez-la

![Configuration IPN](https://cryptogateway-project.github.io/cryptogateway-project/assets/images/ipn1.png)

3. Renseignez votre **URL de callback** et votre **secret IPN**, puis validez

![Formulaire IPN](https://cryptogateway-project.github.io/cryptogateway-project/assets/images/ipn2.png)

Votre serveur recevra une requête POST à chaque transaction. Vérifiez l'authenticité du payload en recalculant la signature HMAC-SHA256 et en la comparant à celle reçue :

```ts
import { signData, dataToSigningString } from "izichangepay";

// Vérification d'une notification IPN entrante
const expectedSignature = signData(dataToSigningString(payload), "your_ipn_secret");
const isValid = expectedSignature === receivedSignature;
```

## Installation

```bash
npm install izichangepay
# ou
pnpm add izichangepay
```

## Démarrage rapide

```ts
import { IziChangePayClient } from "izichangepay";

const client = new IziChangePayClient({
  apiKey: "your_api_key",
  secretKey: "your_secret_key",
  environment: "sandbox", // "live" en production
});
```

## Environnements

| Environnement | URL de base                         |
| ------------- | ----------------------------------- |
| `sandbox`     | `https://sandbox-pay.izichange.com` |
| `live`        | `https://pay.izichange.com`         |

## Cryptomonnaies supportées

| Code           | Actif                        |
| -------------- | ---------------------------- |
| `trx`          | Tron (TRX)                   |
| `btc`          | Bitcoin (BTC)                |
| `btc.bep20`    | Bitcoin Binance (BEP20)      |
| `eth`          | Ethereum (ETH)               |
| `bnb`          | BNB Binance                  |
| `ton`          | Ton (TON)                    |
| `usdt.trc20`   | Tether USDT (TRC20)          |
| `usdt.bep20`   | USDT Binance (BEP20)         |
| `usdt.ton`     | USDT Ton (TON)               |
| `usdc.trc20`   | USD Coin Tron (TRC20)        |
| `usdc.bep20`   | USD Coin Binance (BEP20)     |

## API

### `getBalance(coin?)`

Récupère le solde du portefeuille pour une cryptomonnaie.

```ts
const result = await client.getBalance("trx");
```

| Paramètre | Type   | Défaut  | Description          |
| --------- | ------ | ------- | -------------------- |
| `coin`    | `Coin` | `"trx"` | Cryptomonnaie ciblée |

---

### `generatePayinRedirectUrl(input)`

Génère une URL de redirection pour un paiement entrant. L'utilisateur est redirigé vers cette page pour effectuer son paiement.

```ts
const result = await client.generatePayinRedirectUrl({
  amount: "50",
  coin: "trx",
  acceptedCoins: ["trx", "usdt.trc20"],
  successUrl: "https://example.com/success",
  canceledUrl: "https://example.com/canceled",
  failedUrl: "https://example.com/failed",
  memo: "Order #42", // optionnel
});
```

| Paramètre       | Type       | Requis | Description                                    |
| --------------- | ---------- | ------ | ---------------------------------------------- |
| `amount`        | `string`   | oui    | Montant attendu                                |
| `successUrl`    | `string`   | oui    | Redirection en cas de succès                   |
| `canceledUrl`   | `string`   | oui    | Redirection en cas d'annulation                |
| `failedUrl`     | `string`   | oui    | Redirection en cas d'échec                     |
| `coin`          | `Coin`     | non    | Cryptomonnaie principale (défaut : `"trx"`)    |
| `acceptedCoins` | `string[]` | non    | Cryptomonnaies alternatives acceptées          |
| `memo`          | `string`   | non    | Référence libre (non incluse dans la signature)|

---

### `generatePayinRedirectUrlWithCustomer(input)`

Identique à `generatePayinRedirectUrl`, avec en plus les informations du client.

```ts
const result = await client.generatePayinRedirectUrlWithCustomer({
  amount: "50",
  coin: "trx",
  successUrl: "https://example.com/success",
  canceledUrl: "https://example.com/canceled",
  failedUrl: "https://example.com/failed",
  firstname: "Jean",
  lastname: "Dupont",
  email: "jean.dupont@example.com",
});
```

| Paramètre       | Type       | Requis | Description                                    |
| --------------- | ---------- | ------ | ---------------------------------------------- |
| `amount`        | `string`   | oui    | Montant attendu                                |
| `successUrl`    | `string`   | oui    | Redirection en cas de succès                   |
| `canceledUrl`   | `string`   | oui    | Redirection en cas d'annulation                |
| `failedUrl`     | `string`   | oui    | Redirection en cas d'échec                     |
| `coin`          | `Coin`     | non    | Cryptomonnaie principale (défaut : `"trx"`)    |
| `acceptedCoins` | `string[]` | non    | Cryptomonnaies alternatives acceptées          |
| `firstname`     | `string`   | non    | Prénom du client                               |
| `lastname`      | `string`   | non    | Nom du client                                  |
| `email`         | `string`   | non    | Email du client                                |
| `memo`          | `string`   | non    | Référence libre (non incluse dans la signature)|

---

### `payout(input)`

Effectue un retrait vers une adresse de portefeuille externe.

```ts
const address = await client.payout({
  amount: "100",
  address: "TPEWaf6ZGJDrMbgKYoiM2Ze6BZydeRvDRQ",
  coin: "trx",
});
```

| Paramètre | Type     | Requis | Description                              |
| --------- | -------- | ------ | ---------------------------------------- |
| `amount`  | `string` | oui    | Montant à envoyer                        |
| `address` | `string` | oui    | Adresse du portefeuille destinataire     |
| `coin`    | `Coin`   | non    | Cryptomonnaie à utiliser (défaut : `"trx"`) |

Retourne l'adresse de destination confirmée par l'API.

## Sécurité

Chaque requête est signée via HMAC-SHA256. La signature est construite en concaténant les paramètres sous la forme `clé=valeur` (les tableaux et les valeurs `undefined` sont exclus), puis hashée avec la `secretKey`.

```ts
import { dataToSigningString, signData } from "izichangepay";

const signingString = dataToSigningString({ coin: "trx", amount: "100", address: "TX..." });
const signature = signData(signingString, "your_secret_key");
```

## Gestion des erreurs

Le client lève une erreur si :
- `apiKey` ou `secretKey` est absent à l'instanciation
- `amount` ou `address` est absent pour un payout
- La requête HTTP retourne un statut non-2xx

```ts
try {
  await client.payout({ amount: "100", address: "TX...", coin: "trx" });
} catch (err) {
  console.error(err.message); // "IziChangePayClient: ... failed: 401 — Unauthorized"
}
```

## Prérequis

- Node.js >= 18

## Licence

MIT
