module.exports = ({redis_client, key, ttl}) => ({

    get_data() {
      return new Promise((resolve, reject) => {
        redis_client.get(key, (err, serialized_state) => {
          const done = () => {
            const state = JSON.parse(serialized_state)
            resolve(state)
          }
          err
            ? reject(err)
            : this._set_ttl_if_any(done, reject)
        })
      })
     },

    set_data(new_state) {
      const serialized_state = JSON.stringify(new_state)
      return new Promise((resolve, reject) => redis_client.set(
        key,
        serialized_state,
        err => err
          ? reject(err)
          : this._set_ttl_if_any(resolve, reject)
      ))
    },

    remove_data() {
      return new Promise((resolve, reject) => redis_client.del(
        key,
        err => err
          ? reject(err)
          : resolve()
      ))
    },

    _set_ttl_if_any(done, reject) {
      if (ttl) {
        redis_client.pexpire(
          key,
          ttl,
          err => err
            ? reject(err)
            : done()
        )
      } else {
        done()
      }
    }
})
