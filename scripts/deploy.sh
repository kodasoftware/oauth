#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

if [ -z "$FACEBOOK_API_VERSION" ] || [ -z "$FACEBOOK_APP_ID" ] || [ -z "$FACEBOOK_APP_SECRET" ] || [ -z "$FACEBOOK_APP_TOKEN" ]; then
  echo "You must set all required env vars first"
  echo ""
  echo "  FACEBOOK_API_VERSION (string)  "
  echo "  FACEBOOK_APP_ID (string)  "
  echo "  FACEBOOK_APP_SECRET (string)  "
  echo "  FACEBOOK_APP_TOKEN (string)  "
  exit 1
fi

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "You must set all required env vars first"
  echo ""
  echo "  GOOGLE_CLIENT_ID (string)  "
  echo "  GOOGLE_CLIENT_SECRET (string)  "
  exit 1
fi
if [ -z "$COOKIE_KEYS" ] || [ -z "$CRYPTO_SECRET" ] || [ -z "$DB_CONNECTION_PASSWORD" ] || [ -z "$DB_CONNECTION_USER" ] || [ -z "$JWT_SECRET" ]; then
  echo "You must set all required env vars first"
  echo ""
  echo "  COOKIE_KEYS (string[])  "
  echo "  CRYPTO_SECRET (string)  "
  echo "  DB_CONNECTION_USER (string)  "
  echo "  DB_CONNECTION_PASSWORD (string)  "
  echo "  JWT_SECRET (string)  "
  exit 1
fi

filepath=$DIR/../dist/base/template.secret.env
outfile=$DIR/../dist/base/secrets.env

# Facebook
cat $filepath | \
sed -e "s/__FACEBOOK_API_VERSION__/${FACEBOOK_API_VERSION}/" | \
sed -e "s/__FACEBOOK_APP_ID__/${FACEBOOK_APP_ID}/" | \
sed -e "s/__FACEBOOK_APP_SECRET__/${FACEBOOK_APP_SECRET}/" | \
sed -e "s/__FACEBOOK_APP_TOKEN__/${FACEBOOK_APP_TOKEN}/" | \
sed -e "s/__GOOGLE_CLIENT_ID__/${GOOGLE_CLIENT_ID}/" | \
sed -e "s/__GOOGLE_CLIENT_SECRET__/${GOOGLE_CLIENT_SECRET}/" | \
sed -e "s/__COOKIE_KEYS__/${COOKIE_KEYS}/" | \
sed -e "s/__CRYPTO_SECRET__/${CRYPTO_SECRET}/" | \
sed -e "s/__DB_CONNECTION_USER__/${DB_CONNECTION_USER}/" | \
sed -e "s/__DB_CONNECTION_PASSWORD__/${DB_CONNECTION_PASSWORD}/" | \
sed -e "s/__JWT_SECRET__/${JWT_SECRET}/" > $outfile

if [ "$1" == "local" ]; then
  kubectl delete job oauth-migrations
else
  kubectl -n $1 delete job oauth-migrations
fi
kustomize build $DIR/../dist/overlays/$1 | kubectl apply -f -

rm $outfile
