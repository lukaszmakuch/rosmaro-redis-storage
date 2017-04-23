module.exports = opts => {
  const { redis_client, key } = opts

  return {

    get_data() { return new Promise((resolve, reject) => {
      redis_client.get(key, (err, serialized_state) => {
        if (err) return reject(err)
        const state = JSON.parse(serialized_state)
        resolve(state)
      })
    }) },

    set_data(new_state) { return new Promise((resolve, reject) => {
      const serialized_state = JSON.stringify(new_state)
      redis_client.set(key, serialized_state, err => err ? reject(err) : resolve())
    }) },

    remove_data() { return new Promise((resolve, reject) => {
      redis_client.del(key, err => err ? reject(err) : resolve())
    }) }

  }
}
