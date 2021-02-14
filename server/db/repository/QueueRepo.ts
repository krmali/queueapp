import {EntityRepository, Repository} from "typeorm";
import { Queue } from "../entity/Queue";
import {User} from "../entity/User";
import QRCode from 'qrcode';

@EntityRepository(Queue)
export class QueueRepo extends Repository<Queue>{

    async getMyQueues(userId: string){
      let queues = await this.createQueryBuilder("queue")
        .leftJoinAndSelect("queue.admin", "admin")
        .select([
          "queue.id",
          "name",
          "description",
          "organization",
          "admin.firstName AS adminfname",
          "admin.lastName AS adminlname",
          "qrcode As qrcode"
        ])
        .where("queue.admin.id = :id", {id: userId})
        .getRawMany();
      return queues;
    }

    async getAllQueues(){
      let queues = await this.createQueryBuilder("queue")
        .leftJoinAndSelect("queue.admin", "admin")
        .select([
          "queue.id",
          "name",
          "description",
          "organization",
          "admin.firstName AS adminfname",
          "admin.lastName AS adminlname",
          "qrcode As qrcode"
        ])
        .getRawMany();
        return queues;
    }

    async createNewQueue(name: string
      , admin: User
      , organization: string
      , description = ""
      ){
        let queue = new Queue();
        queue.name = name;
        queue.organization = organization;
        queue.description = description;
        queue.admin = admin
        await this.insert(queue);
        queue.qrcode = await QRCode.toDataURL(queue.id.toString(), {type: 'image/png'});
        queue.save();
        return queue;
    }

    enlistInQueue(queue: Queue, member: User){
      if(queue.members && queue.members.some(u =>  u.id === member.id)) {
        throw new Error("user is already a member");
      }
      if(!queue.members){
        queue.members = new Array<User>();
      }
      queue.members.push(member);
      return queue.save();
    }

    removeFromQueue(queue: Queue, member: User){
      if(queue.members.some(u =>  u.id === member.id)) {
        queue.members = queue.members.filter((u) => u.id !== member.id);
        return queue.save();
      }
      throw new Error("user is already a member");
    }

}
