'use strict';

// Create a DocumentClient that represents the query to add an nft
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * HTTP get method to get one nft by id from a DynamoDB table.
 *
 * @param {Object} event - Input event to the Lambda Function.
 * @param {Object} event.pathParameters HTTP request path parameters
 * @param {Object} event.pathParameters.id NFT ID.
 * @param {Object} [context]
 * @returns {Object} object - API Gateway Lambda Proxy Output Format.
 */
exports.getNftByIdHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`
    );
  }
  // All log statements are written to CloudWatch
  console.info('input event:', event);

  // Get id from pathParameters from APIGateway because of `/{id}` at template.yml
  const { id } = event.pathParameters;

  // Get the nft from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  var params = {
    TableName: tableName,
    Key: { id },
  };
  const data = await docClient.get(params).promise();
  const nft = data.Item;

  const response = {
    statusCode: 200,
    body: JSON.stringify(nft),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
