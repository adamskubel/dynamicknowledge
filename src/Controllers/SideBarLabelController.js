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
            scrollviewSizeHack:true,
            style:"noBorder"
        });
    };

    function _addStateListener(targetController, targetState)
    {
        this.labelView.on('click',function(){
            targetController.setState(targetState);
        });
        this.labelView.setClickable(true);
    }

    function _makeStateTrigger()
    {
        var triggerButton = new BoxView({
            size:[60,60],
            color:Colors.EditColor,
            clickable:true,
            viewAlign:[1,0],
            viewOrigin:[1,0],
            position:[0,0,20]
        });

        this.objectView.add(triggerButton.getModifier()).add(triggerButton.getRenderController());

        return {
            button:triggerButton,
            controller:this,
            addListener:_addStateListener.bind(this)
        };
    }

    SideBarLabelController.prototype.enableMode = function(mode, modeContext)
    {
        switch (mode)
        {
            case "stateLinking":
                var stateSelector = _makeStateTrigger.call(this);
                modeContext.stateTriggers.push(stateSelector);
                break;
        }
    };






});