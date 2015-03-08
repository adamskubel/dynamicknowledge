define(function(require,exports,module){


    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');
    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var Colors = require('Colors');

    var EventEmitter = require('famous/core/EventEmitter');


    function EditorFactory()
    {
    }


    EditorFactory.prototype.addDeleteButton = function(object, deleteCallback)
    {
        return _makeDeleteButton(deleteCallback, object);
    };

    EditorFactory.prototype.addMoveEditor = function(object, moveCallback)
    {
        return _makeBoxMovable(moveCallback, object);
    };

    EditorFactory.prototype.addSizeEditor = function(object, resizeCallback)
    {
        return _makeBoxResizable(resizeCallback, object);
    };

    function _makeBoxMovable(moveCallback,box)
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

            if (box.parent.setFixedChild)
                box.parent.setFixedChild(box);
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
            moveCallback(box.position);
        }.bind(this));

        moveButton.textSurface.hide();
        moveButton.backSurface.pipe(dragController);


        return moveButton;
    }

    function _makeBoxResizable(resizeCallback,box)
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

            if (box.parent.setFixedChild)
                box.parent.setFixedChild(box);
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
            resizeCallback();
        }.bind(this));

        resizeButton.textSurface.hide();
        resizeButton.backSurface.pipe(dragController);
        return resizeButton;
    }


    function _makeDeleteButton(deleteCallback,box)
    {
        var deleteButton = new BoxView({
            text: "X", size: [30, 30], clickable: true, color: 900,
            position: [0, 0, 5], viewAlign: [0, 1], viewOrigin: [0.8, 0.2], fontSize: 'large'
        });
        box.add(deleteButton.getModifier()).add(deleteButton.getRenderController());

        deleteButton.on('click',function(){
            deleteCallback();
        }.bind(this));

        return deleteButton;
    }


    module.exports = EditorFactory;
});
