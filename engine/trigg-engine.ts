import {flow} from '../engine/nools'
class TriggEngine{
    loadRules() {
        var Message = function (message) {
            this.text = message;
        };
        flow("Hello World", function (flow) {
            //find any message that start with hello
            flow.rule("Hello", [Message, "m", "m.text =~ /^hello\\sworld$/"], function (facts) {
                facts.m.text = facts.m.text + " goodbye";
                this.modify(facts.m);
            });
            //find all messages then end in goodbye
            flow.rule("Goodbye", [Message, "m", "m.text =~ /.*goodbye$/"], function (facts) {
                console.log(facts.m.text);
            });
        }).getSession().assert(new Message('hello world')).match();
    }    
    addRule() {
        throw new Error("Method not implemented.");
    }
    removeRule() {
        throw new Error("Method not implemented.");
    }
    forward_sync(){
        throw new Error("Method not implemented.");
    }
    cc(){
        throw new Error("Method not implemented.");
    }
}
let engine = new TriggEngine();
engine.loadRules();