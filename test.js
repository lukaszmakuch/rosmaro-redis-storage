const assert = require('assert')
const make_rosmaro_redis_storage = require('./rosmaro-redis-storage')
const make_redis_client_test_double = require('./redis-client-test-double')

describe("Redis storage for Rosmaro", function () {

  let redis_client, key, storage

  beforeEach(function () {
    redis_client = make_redis_client_test_double()
    key = "abc"
    storage = make_rosmaro_redis_storage({ redis_client, key })
  })

  it("throws the error thrown by the JSON parser if the read data is incorrect", async function () {

    //saving something what's not a valid JSON
    redis_client.set(key, "not JSON")
    redis_client.tick()

    //trying to read the stored data should cause a SyntaxError being thrown
    let thrown
    try {
      const reading = storage.get_data()
      redis_client.tick()
      await reading
    } catch (e) { thrown = e }

    assert(thrown instanceof SyntaxError)
  })

  it("throws the error thrown by the Redis client if writing fails", async function () {

    //breaking the storage
    const redis_error = new Error("expected")
    redis_client.fail_with(redis_error)

    //trying to save some state
    const setting = storage.set_data({a: 123})
    redis_client.tick()

    let thrown
    try { await setting } catch (err) { thrown = err }

    assert.deepEqual(thrown, redis_error)

  })

  it("throws the error thrown by the Redis client if deleting fails", async function () {

    const set_data = {a: 123}

    //saving some state
    const saving = storage.set_data(set_data)
    redis_client.tick()
    await saving

    //breaking the storage
    const redis_error = new Error("expected")
    redis_client.fail_with(redis_error)

    //trying remove the saved data
    const removing = storage.remove_data()
    redis_client.tick()

    //asserting the error has been thrown
    let thrown
    try { await removing } catch (err) { thrown = err }
    assert.deepEqual(thrown, redis_error)

    //fixing the storage so it doesn't throw an error anymore
    redis_client.fix()

    //asserting the previously saved data hasn't been removed
    const reading = storage.get_data()
    redis_client.tick()
    const read = await reading
    assert.deepEqual(set_data, read)

  })

  it("throws the error thrown by the Redis client if reading fails", async function () {

    //first we set something to make sure it's not returned
    const setting = storage.set_data({a: 123})
    redis_client.tick()
    await setting

    //we break the storage
    const redis_error = new Error("expected")
    redis_client.fail_with(redis_error)

    //asserting there's the expected error and no returned value
    let returned
    let thrown
    const reading = storage.get_data()
    redis_client.tick()
    try {
      returned = await reading
    } catch (e) { thrown = e }

    assert(!returned)
    assert.deepEqual(thrown, redis_error)

  })

  it("stores data under the given key", async function () {

    //at the beginning there's no stored data
    assert.deepEqual({}, redis_client.data)

    //reading the stored data returns a nullify value
    let read_before_setting
    const reading_before_setting = storage.get_data()
      .then(data => read_before_setting = data)

    assert(!read_before_setting)

    redis_client.tick()
    await reading_before_setting

    assert(!read_before_setting)

    //storing some data
    let stored_first_set_of_data = false
    const first_set_of_data = {a: 123, b: {c: 456, d: "y"}}
    const storing_for_the_first_time = storage.set_data(first_set_of_data)
      .then(() => stored_first_set_of_data = true)

    assert(!stored_first_set_of_data)

    redis_client.tick()
    await storing_for_the_first_time

    assert(stored_first_set_of_data)

    assert.deepEqual([key], Object.keys(redis_client.data))

    //read the stored data
    let read_stored
    const reading_stored = storage.get_data()
      .then(read => read_stored = read)

    assert(!read_stored),

    redis_client.tick()
    await reading_stored

    assert.deepEqual(first_set_of_data, read_stored)

    //override the previously stored data
    const new_set_of_data = {r: "rosmaro"}
    const overriding = storage.set_data(new_set_of_data)
    redis_client.tick()
    await overriding

    //read the overriden set of data
    const reading_overriden_set_of_data = storage.get_data()
    redis_client.tick()
    const read_overriden_set_of_data = await reading_overriden_set_of_data
    assert.deepEqual(new_set_of_data, read_overriden_set_of_data)

    //add some random data to redis
    redis_client.set("other", 123)
    redis_client.tick()

    //remove all the data
    let removed
    const removing = storage.remove_data()
      .then(() => removed = true)

    assert(!removed),

    redis_client.tick()

    await removing

    //assert no Rosmaro data is stored
    const reading_after_removing = storage.get_data()
    redis_client.tick()
    const read_after_removing = await reading_after_removing
    assert(!read_after_removing)
    assert.deepEqual(["other"], Object.keys(redis_client.data))

  })

})
