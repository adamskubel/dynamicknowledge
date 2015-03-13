define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');
    var Colors = require('Colors');
    var DynamicObjectController = require('Controllers/DynamicObjectController');

    function LabelController(options)
    {
        this.state = options.state || 'base';

        var label = this.makeLabelView(options.objectDef);
        this.labelView = label;
        DynamicObjectController.call(this,{objectDef: options.objectDef, view:label});


        this.labelView._eventOutput.on("textChanged",function(newText){
             this.objectDef.properties.set("text",newText);
        }.bind(this));
    }

    LabelController.prototype = Object.create(DynamicObjectController.prototype);
    LabelController.prototype.constructor = LabelController;
    module.exports = LabelController;

    LabelController.prototype.makeLabelView = function(model)
    {
        return new BoxView({
            text: "Meow",
            position: [0,0,10],
            size: [100,100],
            color: Colors.Annotation,
            useMarkdown:true,
            rendercontrol:true
        });
    };

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
        {
            editors.push("position");
            editors.push("size");
        }
        return editors;
    };
});