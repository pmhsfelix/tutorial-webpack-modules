var add = require('module1').add;
function multImpl(a, b){
    if(a < 0) throw new Error("can't handle negative numbers");
    var res = 0;
    for(var i = 0 ; i < a ; ++i){
        res = add(res, b);
    }
    return res;
}
exports.mult = multImpl;
