define(function(require,exports,module){

    module.exports = AccessInspector;

    var BoxView = require('PositioningLayouts/BoxView');
    var Colors = require('Colors');
    var Utils = require('Utils');

    AccessInspector.prototype = Object.create(BoxView.prototype);
    AccessInspector.prototype.constructor = AccessInspector;

    function AccessInspector(){

        var config = {
            color:Colors.Tungsten,
            text:"Access",
            size:[120,40],
            position:[0,0,0]
        };

        BoxView.call(this,config);

        this._eventInput.on('Access',_onAccessEvent.bind(this));

        _addEventBoxes.call(this);
    }

    AccessInspector.prototype.getOutputEvents = function(){
        return {
            "Access":this.outputBox
        };
    };

    AccessInspector.prototype.getInputEvents = function(){
        return {
            "Access":this.inputBox
        };
    };

    function _onAccessEvent(data)
    {
        this.setText(Utils.hexString(data.address,8));
        this._eventOutput.emit('Access',{
            address:data.address,
            pageIndex:(data.address >>> 12)
        });
    }

    function _addEventBoxes()
    {
        var incomingBox = new BoxView({color:1200,size:[30,30],viewAlign:[0,0.5],viewOrigin:[1,0.5],clickable:true});
        var outgoingBox = new BoxView({color:8000,size:[30,30],viewAlign:[1,0.5],viewOrigin:[0,0.5],clickable:true});

        this.add(incomingBox.getModifier()).add(incomingBox.getRenderController(true));
        this.add(outgoingBox.getModifier()).add(outgoingBox.getRenderController(true));
        incomingBox.parent = this;
        outgoingBox.parent = this;

        this.outputBox = outgoingBox;
        this.inputBox = incomingBox;
    }

});