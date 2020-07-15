var Interface = require('easejs').Interface;

/** XXX: This is temporary; GNU ease.js 0.2.5 release pending to allow
    Traits to extend classes **/

module.exports = Interface('IProtUserInterface', {
  /*** This will be made protected ***/
  'public endRequest': ['code', 'error', 'data'],
});
