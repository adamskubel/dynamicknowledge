define(function(require,exports,module){


    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');
    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var Label = require('Model/Label');
    var Colors = require('Colors');

    var EventEmitter = require('famous/core/EventEmitter');


    function ObjectEditModule(object)
    {
        this.eventEmitter = new EventEmitter();

        this.buttons =[
            _makeBoxMovable(this.eventEmitter,object),
            _makeBoxResizable(this.eventEmitter,object),
            _makeDeleteButton(this.eventEmitter,object)
        ];
    }


    ObjectEditModule.prototype.show = function()
    {
        for (var i=0;i<this.buttons.length;i++)
        {
            this.buttons[i].show();
        }
    };

    ObjectEditModule.prototype.hide = function()
    {
        for (var i=0;i<this.buttons.length;i++)
        {
            this.buttons[i].hide();
        }
    };

    ObjectEditModule.prototype.onObjectDelete = function(deleteCallback)
    {
        this.eventEmitter.on('objectDeleted',deleteCallback);
    };

    ObjectEditModule.prototype.onObjectMoved = function(onMovedCallback)
    {
        this.eventEmitter.on('objectMoved',onMovedCallback);
    };

    ObjectEditModule.prototype.onObjectResized = function(onResizedCallback)
    {
        this.eventEmitter.on('objectResized',onResizedCallback);
    };

    function _makeBoxMovable(emitter,box)
    {

        var moveButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: Colors.EditColor,
            position: [0, 0, 10], viewAlign: [0, 0], viewOrigin: [0.8, 0.8], fontSize: 'large'
        });

        box.add(moveButton.getModifier()).add(moveButton.getRenderController());
        moveButton.show();

        var dragController = new MouseSync();

        dragController.on('start',function(data){
            box.setAnimated(false);
            box.parent.setAnimated(false);
        });

        dragController.on('update', function (data)
        {
            var offset = Vector.fromArray(data.delta);
            var newPos = Vector.fromArray(box.position).add(offset);

            box.setPosition(newPos.toArray());
            box.requestLayout();
        });

        dragController.on('end',function(data){
            box.setAnimated(true);
            box.parent.setAnimated(true);
            emitter.emit('objectMoved');
        }.bind(this));

        moveButton.backSurface.pipe(dragController);


        return moveButton;
    }

    function _makeBoxResizable(emitter,box)
    {

        var resizeButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [1, 1], viewOrigin: [0.2, 0.2], fontSize: 'large'
        });

        box.add(resizeButton.getModifier()).add(resizeButton.getRenderController());
        resizeButton.show();

        var dragController = new MouseSync();

        dragController.on('start',function(data){
            box.setAnimated(false);
            box.parent.setAnimated(false);
        });

        dragController.on('update', function (data)
        {
            var offset = Vector.fromArray(data.delta);
            var newSize = Vector.fromArray(box.size).add(offset);

            box.setSize(newSize.toArray());
            box.requestLayout();
        });

        dragController.on('end',function(data){
            box.setAnimated(true);
            box.parent.setAnimated(true);
            emitter.emit('objectResized');
        }.bind(this));

        resizeButton.backSurface.pipe(dragController);
        return resizeButton;
    }


    function _makeDeleteButton(emitter,box)
    {
        var deleteButton = new BoxView({
            text: "X", size: [30, 30], clickable: true, color: 900,
            position: [0, 0, 5], viewAlign: [0, 1], viewOrigin: [0.8, 0.2], fontSize: 'large'
        });
        box.add(deleteButton.getModifier()).add(deleteButton.getRenderController());

        deleteButton.on('click',function(){
            emitter.emit('objectDeleted');
        }.bind(this));

        return deleteButton;
    }


    module.exports = ObjectEditModule;
});
