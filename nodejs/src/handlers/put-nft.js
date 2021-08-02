'use strict';

const { v4: uuidv4 } = require('uuid');

// Create a DocumentClient that represents the query to add an nft
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * HTTP post method to add one nft to a DynamoDB table.
 *
 * @param {Object} event - Input event to the Lambda Function.
 * @param {Object} event.body HTTP request body.
 * @param {string} event.body.id NFT ID.
 * @param {string} event.body.walletId Owner ID.
 * @param {string} event.body.title NFT title.
 * @param {string} event.body.address NFT address.
 * @param {string} event.body.externalLink NFT external link.
 * @param {Array.<{name: string}>} event.body.tags NFT tags.
 * @param {boolean} event.body.isNsfw Set this NFT as explicit and sensitive content.
 * @param {boolean} event.body.status NFT status.
 * @param {Object} [context]
 * @returns {Object} object - API Gateway Lambda Proxy Output Format.
 */
exports.putNftHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`
    );
  }
  // All log statements are written to CloudWatch
  console.info('input event:', event);

  // Get values from the body of the request.
  const { id, walletId, title, address, externalLink, tags, isNsfw, status } =
    JSON.parse(event.body);

  // Creates a new nft, or replaces an old nft with a new nft
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  var params = {
    TableName: tableName,
    Item: {
      id: id?.length ? id : uuidv4(),
      walletId,
      title,
      address,
      externalLink,
      tags,
      isNsfw,
      status,
    },
  };

  await docClient.put(params).promise();

  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
