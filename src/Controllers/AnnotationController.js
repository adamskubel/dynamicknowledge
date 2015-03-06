define(function (require, exports, module)
{
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./../LineCanvas');

    var Label = require('Model/Label');

    var EventEmitter = require("famous/core/EventEmitter");


    var annoColor = 6000;
    var editColor = 12000;

    function AnnotationController(annotationsDef,modelLoader){

        this._initialized = false;

        this._model = annotationsDef;

        this._eventOutput = new EventEmitter();

        this.modelLoader = modelLoader;
        this.gapiModel = modelLoader.getModel();

        this.annotationMap = {};

        this.setState('base');
    }


    AnnotationController.prototype.getView = function()
    {
        return null;
    };

    AnnotationController.prototype.setContainer = function(container)
    {
        if (!container)
        {
            console.error("Set container must be defined");
        }
        else if (!this.annotationContainer)
        {
            console.log("Initializing annotation container");
            this.annotationContainer = container;
            _initEditUI.call(this, this.annotationContainer);
        }
        else if (this.annotationContainer != container)
        {
            console.error("No container swapping allowed!");
        }
    };

    AnnotationController.prototype.setEditMode = function(mode, editContext)
    {
        if (!this._initialized)
        {
            console.error("Can't set edit mode until controller is added to parent");
            return;
        }

        this._editMode = mode;

        for (var labelKey in this.annotationMap)
        {
            var labelController = this.annotationMap[labelKey];
            labelController.setEditMode(this._editMode);
        }

        if (mode == "IsEditing")
        {
            this._activeStateLabel.show();
            this._containerBackground.show();

            if (editContext.containerMenu.indexOfChild(this.addLabelButton) < 0)
            {
                editContext.containerMenu.addChild(this.addLabelButton);
            }
            this._lastEditContext = editContext;
        }
        else
        {
            if (this._lastEditContext)
                this._lastEditContext.containerMenu.removeChild(this.addLabelButton);
            this._activeStateLabel.show();
            this._containerBackground.hide();
        }
    };

    AnnotationController.prototype.setState = function(state){

        this.state = state;

        if (!this._initialized)
            return;

        this._activeStateLabel.setText(state);

        var stateDef = this._model.stateMap.get(state);

        if (stateDef)
        {
            var labelList = stateDef.children;

            attachList.call(this, labelList);
            loadLabelList.call(this,labelList);
        }
        else
        {
            if (this._editMode == "IsEditing")
            {
                console.log("Creating new state '" + state + "'");
                stateDef = this._model.createState(state);

                for (var labelKey in this.annotationMap)
                {
                    stateDef.children.push(labelKey);
                    this.annotationMap[labelKey].createState(state);
                }

                var labelList = stateDef.children;
                attachList.call(this, labelList);
                loadLabelList.call(this,labelList);
            }
            else
            {
                console.log("State is not defined, removing all labels");
                for (var labelKey in this.annotationMap)
                {
                    this.annotationContainer.removeChild(this.annotationMap[labelKey].labelView);
                    delete this.annotationMap[labelKey];
                }
            }
        }
        this.annotationContainer.requestLayout();

    };


    function loadLabelList(labelList)
    {
        console.log("Loading " + labelList.length + " labels");

        //Remove labels present in container, but not in list
        for (var labelKey in this.annotationMap)
        {
            var found = (labelList.indexOf(labelKey) >= 0);

            if (!found)
            {
                if (this._editMode== "IsEditing")
                {
                    this.annotationMap[labelKey].persist();
                }

                this.annotationContainer.removeChild(this.annotationMap[labelKey].getView());
                delete this.annotationMap[labelKey];
            }
        }

        //Add new labels
        for (var i = 0; i < labelList.length; i++)
        {
            var label = labelList.get(i);
            _addLabel.call(this,label);
        }

    }

    function _addLabel(labelName)
    {
        if (this.annotationMap[labelName])
        {
            this.annotationMap[labelName].setState(this.state);
        }
        else
        {
            console.log("Adding label with name: " + labelName);

            var labelController = this.modelLoader.getObject(labelName);
            labelController.setState(this.state);
            labelController.setEditMode(this._editMode);

            labelController.onDelete(function(){
                this.labelList.removeValue(labelName);
            }.bind(this));

            var labelView = labelController.getView();
            if (labelView)
            {
                this.annotationContainer.addChild(labelView);
                this.annotationMap[labelName] = labelController;
            }
        }
    }

    function _listOnAdded(event){
        for (var i = 0; i < event.values.length; i++)
        {
            var label = event.values[i];
            _addLabel.call(this,label);
        }
    }

    function _listOnRemoved(event){
        for (var i=0;i<event.values.length;i++)
        {
            this.annotationContainer.removeChild(this.annotationMap[event.values[i]].getView());
            delete this.annotationMap[event.values[i]];
        }
    }

    function _listOnSet(event){

        console.log("Set values: " + event.values);
    }

    function attachList(labelList)
    {
        if (this._unloadListCallback)
            this._unloadListCallback();

        this._unloadListCallback = null;

        this.labelList = labelList;

        var onAdded = _listOnAdded.bind(this);
        var onRemoved = _listOnRemoved.bind(this);
        var onSet = _listOnSet.bind(this);

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED,onAdded);
        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, onRemoved);
        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, onSet);

        this._unloadListCallback = function(){
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_ADDED,onAdded);
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, onRemoved);
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_SET, onSet);
        };
    }

    AnnotationController.prototype.close = function()
    {
        _saveAnnotations.call(this);
        this.setEditMode("CanEdit");
    };

    function _createLabel()
    {
        var model = Label.create(this.gapiModel,this.modelLoader.nextObjectId());

        if (!this._model.stateMap.has(this.state))
        {
            console.log("Creating new state '" + this.state + "'");
            var stateDef = this._model.createState(this.state);
            var labelList = stateDef.children;
            attachList.call(this, labelList);
            loadLabelList.call(this,labelList);
        }

        model.size = [160, 80];
        model.text = "Label!";
        var newState = model.createState(this.state);
        newState.position = [0,-10,0];

        this.modelLoader.addObject(model.id,model);

        this.labelList.push(model.id);
    }

    function _initEditUI(dc)
    {
        if (!this._initialized)
        {
            var addLabelButton = new BoxView({
                text: "A+", size: [40, 40], clickable: true, color: annoColor,
                position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
            });

            addLabelButton.on('click', _createLabel.bind(this));

            var activeStateLabel = new BoxView({
                text: this.state,
                size: [100, 30],
                color: annoColor,
                position: [0, 0, 15],
                viewOrigin: [1,1],
                viewAlign: [1,0],
                clickable:true
            });

            activeStateLabel.on('click',function(){
                this.setState('base');
            }.bind(this));

            dc.add(activeStateLabel.getModifier()).add(activeStateLabel.getRenderController());

            this._activeStateLabel = activeStateLabel;
            this.addLabelButton = addLabelButton;

            var containerBackground = new BoxView({
                color: annoColor,
                style: 'borderOnly',
                size: [undefined,undefined]
            });

            dc.add(containerBackground.getModifier()).add(containerBackground.getRenderController());

            this._containerBackground = containerBackground;
            this._initialized = true;
            console.log("Annotation controller init");
        }
    }

    function _saveAnnotations()
    {
        for (var key in this.annotationMap)
        {
            var labelController = this.annotationMap[key];
            labelController.persist();
        }
    }

    module.exports = AnnotationController;

});