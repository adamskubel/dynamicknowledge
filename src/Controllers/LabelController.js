define(function(require,exports,module){

    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');

    var LineCanvas = require('./../LineCanvas');

    var Label = require('Model/Label');
    var Colors = require('Colors');
    var ObjectEditModule = require('Modules/ObjectEditModule');



    function LabelController(model)
    {
        this.model = model;
        this.editMode = "ReadOnly";
        this.state = "base";
    }

    LabelController.prototype.getView = function()
    {
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
                this.objectEditor.show();
            }
            else
            {
                this.view.setEditable(false);
                this.objectEditor.hide();
                this.persist();
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
            textAlign: [0,0],
            useMarkdown:true
        });

        newLabel.getRenderController();

        this.labelView = newLabel;

        this.objectEditor = new ObjectEditModule(newLabel);

        return newLabel;
    }





    module.exports = LabelController;
});