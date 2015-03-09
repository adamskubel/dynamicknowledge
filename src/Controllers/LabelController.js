define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');
    var Colors = require('Colors');
    var DynamicObjectController = require('Controllers/DynamicObjectController');


    function LabelController(objectDef, modelLoader)
    {
        var label = makeLabelView(objectDef);
        DynamicObjectController.call(this,objectDef,modelLoader,label);

        this.labelView = label;

        this.labelView._eventOutput.on("textChanged",function(newText){
             this.objectDef.properties.set("text",newText);
        }.bind(this));
    }

    LabelController.prototype = Object.create(DynamicObjectController.prototype);
    LabelController.prototype.constructor = LabelController;
    module.exports = LabelController;

    function makeLabelView(model)
    {
        var labelState = model.getState('base');
        if (!labelState)
        {
            console.error("Model does not have current state");
            return;
        }

        if (!model.properties.has("text"))
        {
            model.properties.set("text","Hello!");
            labelState.properties.set("size",[200, 100]);
            labelState.properties.set("position",[0,0,0]);
        }

        return new BoxView({
            text: model.properties.get("text"),
            position: labelState.properties.get("position"),
            size: labelState.properties.get("size"),
            color: Colors.Annotation,
            useMarkdown:true
        });
    }

    LabelController.prototype.createEditors = function(editContext)
    {
        DynamicObjectController.prototype.createEditors.call(this,editContext);
        this.labelView.setEditable(true);
    };

    LabelController.prototype.destroyEditors = function()
    {
        DynamicObjectController.prototype.destroyEditors.call(this);
        this.labelView.setEditable(false);
    };

    LabelController.prototype.createEditRules = function(editContext)
    {
        var editors = [];

        editors.push("delete");

        if (this.labelView.parent.childControlsPosition())
            editors.push("position");

        editors.push("size");

        return editors;
    };
});