import { Session, noolsengine } from 'nools';
declare var nools: noolsengine;
export class TriggEngine{
    loadRules() {
        const Message = function (message) {
            this.text = message;
        };
        const session: Session = nools.flow('Hello World', function (f) {
            f.rule('Hello', [Message, 'm', 'm.text =~ /^hello\\sworld$/'], function (facts) {
                facts.m.text = facts.m.text + ' goodbye';
                this.modify(facts.m);
            });
            f.rule('Goodbye', [Message, 'm', 'm.text =~ /.*goodbye$/'], function (facts) {
                console.log(facts.m.text);
            });
        }).getSession();
        session.assert(new Message('hello world'));
        session.match();
        session.match();
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync(){
        throw new Error('Method not implemented.');
    }
    cc(){
        throw new Error('Method not implemented.');
    }
}
