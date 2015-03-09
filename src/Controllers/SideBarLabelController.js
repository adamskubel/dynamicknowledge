define(function(require,exports,module){

    var LabelController = require('./LabelController');
    var BoxView = require('PositioningLayouts/BoxView');
    var Colors = require('Colors');

    function SideBarLabelController(objectDef)
    {
        LabelController.call(this,objectDef,DynamicKnowledge.ModelLoader);
    }

    SideBarLabelController.prototype = Object.create(LabelController.prototype);
    SideBarLabelController.prototype.constructor = SideBarLabelController;
    module.exports = SideBarLabelController;


    SideBarLabelController.prototype.makeLabelView =  function(model)
    {
        var labelState = model.getState('base');
        if (!labelState)
        {
            console.error("Model does not have current state");
            return;
        }

        if (!model.properties.has("text"))
        {
            model.properties.set("text","Hello sir");
            labelState.properties.set("position",[0,0,0]);
        }

        return new BoxView({
            text: model.properties.get("text"),
            position: labelState.properties.get("position"),
            size:[100,true],
            color: Colors.Annotation,
            useMarkdown:true,
            scrollviewSizeHack:true
        });
    };


});