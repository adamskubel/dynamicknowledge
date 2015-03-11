define(function(require,exports,module){

    var LabelController = require('./LabelController');
    var BoxView = require('PositioningLayouts/BoxView');
    var Colors = require('Colors');
    var ToggleButton = require('Views/ToggleButton');
    var Connection = require('Model/Connection');

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

    function _triggerStates()
    {
        for (var id in this._stateListenerMap)
        {
            if (!this._stateListenerMap.hasOwnProperty(id)) continue;

            this._stateListenerMap[id]();
        }
    }


    SideBarLabelController.prototype.addStateTrigger = function(targetController, targetState)
    {
        _addStateListener.call(this,targetController,targetState);
    };

    function _isStateListener(controller)
    {
        if (!this._stateListenerMap)
            return false;

        if (!this._stateListenerMap[controller.getId()])
            return false;

        return this._stateListenerMap[controller.getId()]._targetState;
    };

    function _addStateListener(targetController, targetState)
    {
        if (!this._stateListenerMap)
        {
            this._stateListenerMap = {};
            this.labelView.setClickable(true);
            this.labelView.on('click',_triggerStates.bind(this));
        }

        var stateFunction = function(){
            targetController.setState(targetState);
        };

        stateFunction._targetState = targetState;
        stateFunction._targetController = targetController;

        this._stateListenerMap[targetController.getId()] = stateFunction;
    }

    function _removeStateListener(controller)
    {
        delete this._stateListenerMap[controller.getId()];
    }

    function _addStateListenerModel(targetController, targetState)
    {
        var triggerRelationship = Connection.create(
            this.gapiModel,
            targetController.getId() + ":" + targetState,
            "stateTrigger");

        triggerRelationship.to = targetController.getId();
        triggerRelationship.properties.set("targetState",targetState);

        this.objectDef.relationships.push(triggerRelationship);
    }

    function _removeStateListenerModel(targetController)
    {
        _removeStateListener.call(this,targetController);

        var stateRelationships = this.objectDef.getRelationshipsOfType("stateTrigger");

        for (var i=0;i<stateRelationships.length;i++)
        {
            if (stateRelationships[i].to == targetController.getId())
            {
                this.objectDef.relationships.removeValue(stateRelationships[i]);
            }
        }
    }

    function _makeStateTrigger()
    {
        var triggerButton = new ToggleButton({
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
            addListener:_addStateListenerModel.bind(this),
            removeListener:_removeStateListenerModel.bind(this),
            hasListener:_isStateListener.bind(this)
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