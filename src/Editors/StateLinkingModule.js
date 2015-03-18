define(function(require,exports,module)
{
    var Utils = require('Utils');
    var ListSelector = require('Views/ListSelector');
    var MenuBar = require('Views/MenuBar');
    var Colors = require('Colors');

    function StateLinkingModule(parentController)
    {
        this.controller = parentController;
        this._objectsToHide = [];
        this._activeTriggerCleanupFunctions = [];
    }


    StateLinkingModule.prototype.createUI = function(menu)
    {
        this.hide();

        var addButton = MenuBar.makeToggleButton("S");
        addButton.on('toggleOn',_editStates.bind(this));
        addButton.on('toggleOff',_stopEditing.bind(this));

        this._hideObjectFunction = function()
        {
            menu.removeChild(addButton);
        };

        menu.addChild(addButton);

        this._hideObjectFunction = function()
        {
            menu.removeChild(addButton);
        }
    };

    StateLinkingModule.prototype.hide = function()
    {
        _stopEditing.call(this);
        if (this._hideObjectFunction)
            this._hideObjectFunction();

    };

    function _stopEditing()
    {
        _deactivateTrigger.call(this);

        for (var i=0;i<this._objectsToHide.length;i++)
        {
            var object =  this._objectsToHide[i];
            object.hide();
        }

        this._objectsToHide = [];

        this.controller.disableMode();
    }


    function _deactivateTrigger()
    {
        if (!this._activeVertex)
            return;

        this._activeVertex.button.setState(false);

        for (var i=0;i<this._activeTriggerCleanupFunctions.length;i++)
        {
            this._activeTriggerCleanupFunctions[i]();
        }

        this._activeVertex = undefined;
    }

    function _activateTrigger(trigger, listenEnablers)
    {
        if (this._activeVertex != trigger)
            _deactivateTrigger.call(this);

        this._activeVertex = trigger;

        function prepareEnabler(enabler)
        {
            enabler.button.show();

            var currentTriggeredState = trigger.hasListener(enabler.controller);
            if (!currentTriggeredState)
            {
                enabler.button.setState(false);
                enabler.button.setText("");
            }
            else
            {
                enabler.button.setState(true);

                if (currentTriggeredState == enabler.controller._specifiedState ||
                    (!enabler.controller._specifiedState  && currentTriggeredState == "*inherited*"))
                    enabler.button.setText(currentTriggeredState)
                else
                    enabler.button.setText("[" + currentTriggeredState + "]");
            }

            var onEvent = function()
            {
                var state = enabler.controller._specifiedState;
                if (!state)
                {
                    console.log("Setting state to inherited");
                    state = "*inherited*";
                }

                enabler.button.setText(state);
                trigger.addListener(enabler.controller, state);
            };

            var offEvent = function(){
                enabler.button.setText("");
                trigger.removeListener(enabler.controller);
            };

            enabler.button.on('toggleOn',onEvent);
            enabler.button.on('toggleOff', offEvent);

            this._activeTriggerCleanupFunctions.push(function()
            {
                enabler.button.removeListener('toggleOn',onEvent);
                enabler.button.removeListener('toggleOff', offEvent);
                enabler.button.hide();
            });
        }

        for (var i=0;i<listenEnablers.length;i++)
        {
            prepareEnabler.call(this, listenEnablers[i]);
        }
    }

    function _editStates()
    {
        var stateTriggers = [];
        var triggerListenEnablers = [];

        this.controller.visitAll(function(controller){

            if (!controller.enableMode)
                return;

            var stateModeContext = {
                stateTriggers:stateTriggers,
                listenEnablers:triggerListenEnablers
            };

            controller.enableMode("stateLinking",stateModeContext);
        });


        function prepareTrigger(stateTrigger)
        {
            stateTrigger.button.on('toggleOn', function () {
                _activateTrigger.call(this, stateTrigger, triggerListenEnablers);
            }.bind(this));

            stateTrigger.button.on('toggleOff', function () {
                _deactivateTrigger.call(this);
            }.bind(this));
        }

        for (var i=0;i<stateTriggers.length;i++)
        {
            this._objectsToHide.push(stateTriggers[i].button);
            prepareTrigger.call(this,stateTriggers[i]);
        }
    }

    module.exports = StateLinkingModule;

});