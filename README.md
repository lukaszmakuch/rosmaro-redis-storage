# Redis backed storage for Rosmaro
This package makes it possible to store Rosmaro data in Redis.
## Installation
```
$ npm i rosmaro-redis-storage --save
```
## Building a storage
First you will need a Redis client. For details on how to get it please check the [documentation of the redis package](https://github.com/NodeRedis/node_redis).

Then you can build a storage like this:
```js
const make_redis_backed_storage = require('rosmaro-redis-storage')

const redis_backed_storage = make_redis_backed_storage({
  redis_client: the_redis_client_to_use,
  key: all_the_data_is_stored_under_this_redis_key
})
```

Please note that the provided key is used as it is, without any changes. So if you already have something stored under this key, it's going to be overriden. A situation like that may occur if you use the [rosmaro-redlock](https://github.com/lukaszmakuch/rosmaro-redlock) package and provide the same value as the *resource* parameter.
