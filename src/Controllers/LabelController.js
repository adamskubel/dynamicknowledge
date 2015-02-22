define(function(require,exports,module){

    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./../LineCanvas');

    var Label = require('Model/Label');
    var Colors = require('Colors');

    function LabelController(model)
    {
        this.model = model;
        this.editMode = "ReadOnly";
        this.state = "base";
    }


    LabelController.prototype.getView = function(){
        if (!this.view)
        {
            this.view = _addLabelBox.call(this);
            this.setEditMode(this.editMode);
            this.setState(this.state);
        }

        return this.view;
    };

    LabelController.prototype.setEditMode = function(editMode)
    {
        this.editMode = editMode;
        console.log("Label edit mode set to " + editMode);

        if (this.view)
        {
            if (editMode == 'IsEditing')
            {
                this.view.setEditable(true);
                this.moveButton.show();
                this.sizeButton.show();
                this.deleteButton.show();
            }
            else
            {
                this.view.setEditable(false);
                this.moveButton.hide();
                this.sizeButton.hide();
                this.deleteButton.hide();
            }
        }
    };

    LabelController.prototype.setState = function(state){
        this.state = state;

        if (this.model.hasState(state))
        {
            if (this.view)
            {
                var newPos = this.model.getState(state).position;
                console.log("Setting label position: " + newPos);
                this.view.setPosition(newPos);
                this.view.show();
            }
        }
        else
        {
            if (this.view)
                this.view.hide();
        }

    };

    LabelController.prototype.createState = function(state){
        if (!this.model.hasState(state))
        {
            console.log("Creating new label state '" + state + "'");
            var currentState = this.model.getState(this.state);
            var newState = this.model.createState(state);
            newState.position = currentState.position;
        }
    };

    LabelController.prototype.onDelete = function(deleteCallback){
        this.deleteCallback = deleteCallback;
    };

    LabelController.prototype.persist = function(){

        if (this.view)
        {
            this.model.text = this.view.getText();
            this.model.size = this.view.size;

            if (!this.model.hasState(this.state))
                this.model.createState(this.state);

            this.model.getState(this.state).position = this.view.position;
        }
    };

    function _addLabelBox()
    {
        var labelState = this.model.getState(this.state);
        if (!labelState)
        {
            console.warn("Active state '" + this.state + "' not found in label");
            return;
        }

        if (!this.model.size)
        {
            console.warn("Model has no defined size");
            this.model.size = [200, 100];
        }

        var newLabel = new BoxView({
            text: this.model.text,
            position: labelState.position,
            viewOrigin: [0, 0],
            size: this.model.size,
            color: Colors.Annotation,
            editable: true,
            renderWhitespace:true
        });

        newLabel.getRenderController();

        this.moveButton = _makeBoxMovable.call(this,newLabel);
        this.sizeButton = _makeBoxResizable.call(this,newLabel);
        this.labelView = newLabel;
        this.deleteButton = _makeDeleteButton.call(this,newLabel);

        return newLabel;
    }


    function _makeBoxMovable(box)
    {

        var moveButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: Colors.EditColor,
            position: [0, 0, 10], viewAlign: [0, 0], viewOrigin: [0.8, 0.8], fontSize: 'large'
        });

        Utils.attachRenderController(moveButton);
        box.add(moveButton.getModifier()).add(moveButton.renderController);
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
            this.model.getState(this.state).position = box.position;
            console.log("Saving position");
        }.bind(this));

        moveButton.backSurface.pipe(dragController);


        return moveButton;
    }

    function _makeBoxResizable(box)
    {

        var resizeButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [1, 1], viewOrigin: [0.2, 0.2], fontSize: 'large'
        });
        Utils.attachRenderController(resizeButton);

        box.add(resizeButton.getModifier()).add(resizeButton.renderController);
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
            this.model.size = box.size;
            console.log("Saving size");
        }.bind(this));

        resizeButton.backSurface.pipe(dragController);
        return resizeButton;
    }


    function _makeDeleteButton(box)
    {
        var deleteButton = new BoxView({
            text: "X", size: [30, 30], clickable: true, color: 900,
            position: [0, 0, 5], viewAlign: [0, 1], viewOrigin: [0.8, 0.2], fontSize: 'large'
        });
        box.add(deleteButton.getModifier()).add(deleteButton.getRenderController());

        deleteButton.on('click',function(){
            this.deleteCallback();
        }.bind(this));

        return deleteButton;
    }


    module.exports = LabelController;
});