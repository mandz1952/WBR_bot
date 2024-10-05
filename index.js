import {db} from './firebase.js'
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import {Bot, GrammyError, HttpError, InlineKeyboard} from 'grammy'
import {hydrate} from "@grammyjs/hydrate";
import "dotenv/config.js";
import {isMatch} from "underscore";

const myResume = {
    city: '',
    workExp: '',
    age: '',
}

const myVacancy = {
    city: '',
    workExp: '',
    age: '',
    desc: '',
}

const myAd = {
    desc: ''
}

let SuiAdd = []

let SuiVacancy = []

let AllComplaint = []

let BanList = []

const readWorker = async (ctx) => {
    const q = query(collection(db, "worker"), where("uid", "==", ctx.from.id), orderBy("uid"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        myResume.city = doc.data().city;
        myResume.workExp = doc.data().workExp;
        myResume.age = doc.data().age;
    });
}

const readAd = async () => {
    const querySnapshot = await getDocs(collection(db, "ad"));
    querySnapshot.forEach((doc) => {
        SuiAdd.push(doc.data());
    });
}

const addAd = async () => {
    try {
        const docRef = await addDoc(collection(db, "ad"), {
            desc: myAd.desc,
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const getSuitableVacancy = async (ctx) => {
    await readWorker(ctx)
    const qCity = query(collection(db, "vacancy"), where("city", "==", myResume.city), orderBy("city"));

    const qSCity = await getDocs(qCity);

    qSCity.forEach((doc) => {
        const SVacancy = {}
        SVacancy.city = doc.data().city;
        SVacancy.workExp = doc.data().workExp;
        SVacancy.age = doc.data().age;
        if (isMatch(SVacancy, myResume)) {
            SuiVacancy.push(doc.data())
        }
    })

}

const isUser = async (ctx, coll) => {
    const q = query(collection(db, coll), where("uid", "==", ctx.from.id), orderBy("uid"));

    const querySnapshot = await getDocs(q);
    let docs = await querySnapshot.docs;
    return docs
}

const addVacancy = async (ctx) => {
    try {
        const docRef = await addDoc(collection(db, "vacancy"), {
            city: myVacancy.city,
            workExp: myVacancy.workExp,
            age: myVacancy.age,
            uid: ctx.from.id,
            desc: myVacancy.desc,
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const addWorker = async (ctx) => {
    try {
        const docRef = await addDoc(collection(db, "worker"), {
            city: myResume.city,
            workExp: myResume.workExp,
            age: myResume.age,
            uid: ctx.from.id,
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const readVacancy = async (ctx) => {
    const q = query(collection(db, "vacancy"), where("uid", "==", ctx.from.id), orderBy("uid"));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        myVacancy.city = doc.data().city;
        myVacancy.workExp = doc.data().workExp;
        myVacancy.age = doc.data().age;
        myVacancy.desc = doc.data().desc;
    });
}

const addComplaint = async (uid, desc, city, workExp, age) => {
    try {
        const docRef = await addDoc(collection(db, "complaint"), {
            uid,
            desc,
            city,
            workExp,
            age
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const readComplaint = async () => {
    const q = query(collection(db, "complaint"));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const SComplaint = {}
        SComplaint.city = doc.data().city;
        SComplaint.workExp = doc.data().workExp;
        SComplaint.age = doc.data().age;
        SComplaint.desc = doc.data().desc;
        AllComplaint.push(SComplaint)
    });
}

const deleteComplaint = async () => {
    const q = query(collection(db, 'complaint'), where('uid', '==', AllComplaint[iComplaint].uid))

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docu) => {
        await deleteDoc(doc(db, 'complaint', docu.id));
    });
}

const banUser = async () => {
    try {
        const docRef = await addDoc(collection(db, "banList"), {
            uid: AllComplaint[iComplaint].uid
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const readBanUser = async () => {
    const q = query(collection(db, 'complaint'))

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docu) => {
        await deleteDoc(doc(db, 'complaint', docu.id));
    });
}

const ignoreComplaint = async () => {
    const q = query(collection(db, "complaint"), where('uid', '==', AllComplaint[iComplaint].uid));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        doc.data().delete()
    })
}

const deleteMyInfo = async (dbName, arr) => {
    const q = query(collection(db, dbName), where('uid', '==', arr.uid));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docu) => {
        await deleteDoc(doc(db, dbName, docu.id));
    })
    Object.keys(arr).forEach(k => delete arr[k])
}

const updateMyInfo = async (dbName, arr) => {
    const q = query(collection(db, dbName), where('uid', '==', arr.uid));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docu) => {
        await updateDoc(doc(db, dbName, docu.id), {
            city: myResume.city,
            workExp: myResume.workExp,
            age: myResume.age,
        })
    })
}

const bot = new Bot(process.env.BOT_API_KEY);
bot.use(hydrate())

bot.api.setMyCommands([
    {
        command: "start",
        description: 'Запускает бота'
    },
    {
        command: "help",
        description: "Помощь"
    },
    {
        command: "my_resume",
        description: 'Ваше резюме'
    },
    {
        command: "my_vacancy",
        description: 'Ваша вакансия'
    },
    {
        command: 'vacancy',
        description: 'Подходящие вакансии'
    }
])

let isOpen = false
let isAd = false
let iVacancy = 0
let scrollV = 0
let iAdd = 0
let iComplaint = 0
let Warning = true
let isUpdate = false

bot.on('message').filter(async (ctx) => {
    readBanUser()
    return BanList.indexOf(ctx.from.id) != -1;
}, async (ctx) => {
    await ctx.reply('Вас заблокировали')
})

bot.on("message").filter(
    async (ctx) => {
        return isOpen === true
    },
    async (ctx) => {
        myVacancy.desc = ctx.msg.text
        await ctx.reply('Спасибо, Ваша вакансия сохранилась, заполните категории, чтобы соискателям было легче Вас найти', {
            reply_markup: whichCityKB
        })
    },
);

bot.hears('Жалобы').filter( async (ctx) => {
    return ctx.from.id == process.env.ADMIN_ID || ctx.from.id == process.env.ADMIN_ID_SECOND;
}, async (ctx) => {
    await readComplaint()
    await ctx.reply(`Жалоба\n    uid: ${AllComplaint[iComplaint].uid}\n    Описание: ${AllComplaint[iComplaint].desc}\n    Город: ${AllComplaint[iComplaint].city}\n    Опыт работы: ${AllComplaint[iComplaint].workExp}\n    Возраст: ${AllComplaint[iComplaint].age}`, {
            reply_markup: complaintKB
    });
    AllComplaint = []
})

bot.on('message').filter( async () => {
    return isAd == true
}, async (ctx) => {
    myAd.desc = ctx.msg.text
    addAd()
    isAd = false
    await ctx.reply('Реклама добавлена на сервер')
})

const mainKeyboard = new InlineKeyboard()
    .text("Соискатель", "worker")
    .text("Работодатель", "employer")

const whichCityKB = new InlineKeyboard()
    .text('Махачкала', "mkch")
    .text('Москва', 'msc')
    .row()
    .text('Грозный', 'grz')
    .text('Удаленно', 'online')

const whichWorkExpKB = new InlineKeyboard()
    .text('Нет опыта', '0exp')
    .text('От 1 до 3 лет', '3exp')
    .row()
    .text('От 3 до 6 лет', '6exp')
    .text('От 6 лет', 'm6exp')
    .row()
    .text('Не имеет значения', 'dc')

const whichAgeKB = new InlineKeyboard()
    .text('Менее 18 лет', 'b18')
    .text('От 18 до 25 лет', 'b25')
    .row()
    .text('Более 25 лет', 'a25')

const vacancyKB = new InlineKeyboard()
    .text('Назад', 'before')
    .text('Далее', 'after')
    .row()
    .text('Жалоба', 'complaint')

const complaintKB = new InlineKeyboard()
    .text('Назад', 'c<')
    .text('Далее', 'c>')
    .row()
    .text('Удалить вакансию', 'delete')
    .text('Забанить пользователя', 'ban')
    .row()
    .text('Игнорировать', 'ignore')

const warningKB = new InlineKeyboard()
    .text('Далее', 'cont')

const deleteMyResumeKB = new InlineKeyboard()
    .text('Редактировать', 'editResume')
    .row()
    .text('Удалить', 'deleteResume')

const deleteMyVacancyKB = new InlineKeyboard()
    .text('Редактировать', 'editVacancy')
    .row()
    .text('Удалить', 'deleteVacancy')

bot.command('start', async (ctx) => {
    await ctx.reply("Укажите ниже, Вы соискатель или работодатель",{
        reply_markup: mainKeyboard
    })
})

bot.command('read_ad', async (ctx) => {
    await readAd()
    await SuiAdd.map((i) => {
        ctx.reply(i.desc)
    })
})

bot.callbackQuery('worker', async (ctx) => {
    await ctx.answerCallbackQuery()

    if ((await isUser(ctx, 'worker')).length == 0) {
        await ctx.callbackQuery.message.editText('Давайте определимся в каком городе Вы ищете сотрудников', {
            reply_markup: whichCityKB
        })
    } else  {
        await ctx.callbackQuery.message.editText('У вас уже есть резюме')
    }
})

bot.callbackQuery('employer', async (ctx) => {
    if ((await isUser(ctx, 'vacancy')).length == 0) {
        await ctx.callbackQuery.message.editText('Опишите Вашу вакансию')
        isOpen = true
    } else  {
        await ctx.callbackQuery.message.editText('У вас уже есть вакансия')
        isOpen = false
    }
    await ctx.answerCallbackQuery()
    console.log(ctx.msg)
})

bot.callbackQuery(['mkch', 'msc', 'grz', 'online'], async (ctx) => {


    if (isOpen) {
        switch (ctx.callbackQuery.data) {
            case 'mkch':
                myVacancy.city = 'Махачкала'
                break
            case 'msc':
                myVacancy.city = 'Москва'
                break
            case 'grz':
                myVacancy.city = 'Грозный'
                break
            case 'online':
                myVacancy.city = 'Удаленно'
        }
        await ctx.callbackQuery.message.editText('Давайте определимся какой опыт работы должен быть у сотрудника', {
            reply_markup: whichWorkExpKB
        })
    } else {
        switch (ctx.callbackQuery.data) {
            case 'mkch':
                myResume.city = 'Махачкала'
                break
            case 'msc':
                myResume.city = 'Москва'
                break
            case 'grz':
                myResume.city = 'Грозный'
                break
            case 'online':
                myResume.city = 'Удаленно'
        }
        await ctx.callbackQuery.message.editText('Давайте определимся какой у Вас опыт работы', {
            reply_markup: whichWorkExpKB
        })
    }

    await ctx.answerCallbackQuery()
})

bot.callbackQuery(['0exp', '3exp', '6exp', 'm6exp', 'dc'], async (ctx) => {
    if (isOpen) {
        switch (ctx.callbackQuery.data) {
            case '0exp':
                myVacancy.workExp = 'Нет опыта'
                break
            case '3exp':
                myVacancy.workExp = 'От 1 до 3 лет'
                break
            case '6exp':
                myVacancy.workExp = 'От 3 до 6 лет'
                break
            case 'm6exp':
                myVacancy.workExp = 'От 6 лет'
                break
            case 'dc':
                myVacancy.workExp = 'Не имеет значения'
        }
        await ctx.callbackQuery.message.editText('Давайте определимся какой возраст должен быть у сотрудника', {
            reply_markup: whichAgeKB
        })
    } else {
        switch (ctx.callbackQuery.data) {
            case '0exp':
                myResume.workExp = 'Нет опыта'
                break
            case '3exp':
                myResume.workExp = 'От 1 до 3 лет'
                break
            case '6exp':
                myResume.workExp = 'От 3 до 6 лет'
                break
            case 'm6exp':
                myResume.workExp = 'От 6 лет'
                break
            case 'dc':
                myResume.workExp = 'Не имеет значения'
        }
        await ctx.callbackQuery.message.editText('Давайте определимся какой у Вас возраст ', {
            reply_markup: whichAgeKB
        })
    }
})

bot.callbackQuery(['b18', 'b25', 'a25'], async (ctx) => {
    if (isOpen) {
        switch (ctx.callbackQuery.data) {
            case 'b18':
                myVacancy.age = 'Меньше 18'
                break
            case 'b25':
                myVacancy.age = 'От 18 до 25'
                break
            case 'a25':
                myVacancy.age = 'Более 25'
    }
        await ctx.callbackQuery.message.editText('Вакансия готова!')
        isUpdate ? updateMyInfo('vacancy', myVacancy) : addVacancy(ctx)
        isUpdate = false
    } else {
        switch (ctx.callbackQuery.data) {
            case 'b18':
                myResume.age = 'Меньше 18'
                break
            case 'b25':
                myResume.age = 'От 18 до 25'
                break
            case 'a25':
                myResume.age = 'Более 25'
                break
    }
        isUpdate ? updateMyInfo('worker', myVacancy) : addWorker(ctx)
        isUpdate = false
        await ctx.callbackQuery.message.editText('Резюме готово!')
}
    isOpen = false
})

bot.command('help', async (ctx) => {
    await ctx.reply("Если Вам нужна помощь можете обратиться к [модератору](https://t.me/wbrhelp)",{
        parse_mode: "Markdown"
    })
})

bot.command('my_resume', async (ctx) => {
    await readWorker(ctx)
    await ctx.reply(`Ваше резюме: \n Город: ${myResume.city} \n Опыт работы: ${myResume.workExp} \n Возраст: ${myResume.age}`, {
        parse_mode: "Markdown",
        reply_markup: deleteMyResumeKB
    })
})

bot.command('my_vacancy', async (ctx) => {
    readVacancy(ctx)
    await ctx.reply(`Ваша вакансия: \n Город: ${myVacancy.city} \n ЗП: ${myVacancy.price} \n Опыт работы: ${myVacancy.workExp} \n Возраст: ${myVacancy.age} \n Описание: ${myVacancy.desc}`, {
        parse_mode: "Markdown",
        reply_markup: deleteMyVacancyKB
    })
})

bot.command('vacancy', async (ctx) => {

    // if (Warning) {
    //     await ctx.reply('ВНИМАНИЕ! ⚠️  \n' +
    //         '\n' +
    //         'В мире онлайн-работ скрываются опасности! 🚧  \n' +
    //         '\n' +
    //         'Мы не несем ответственности за:\n' +
    //         '\n' +
    //         '* Потери времени и денег! 💸\n' +
    //         '* Неожиданные трудности! 🤯\n' +
    //         '* И, возможно, даже...   🤫\n' +
    //         '\n' +
    //         'Если вы видите подозрительные резюме или вакансии, немедленно сообщите об этом! 🚨\n' +
    //         '\n' +
    //         'Как действовать? 🤔\n' +
    //         '\n' +
    //         '* Подайте жалобу! 📣\n' +
    //         '* Свяжитесь со службой поддержки! 📞\n' +
    //         '* Поделитесь информацией с другими! 🗣️\n' +
    //         '\n' +
    //         'Но помни:\n' +
    //         'Будь осторожен! 🚫', {
    //         reply_markup: warningKB
    //     })
    //     Warning = false
    // } else {
    //     await getSuitableVacancy(ctx)
    //     await ctx.reply(SuiVacancy[iVacancy].desc, {
    //         reply_markup: vacancyKB
    //     })
    //     SuiVacancy = []
    // }
    await getSuitableVacancy(ctx)
    console.log(SuiVacancy)
    console.log(iVacancy)
    await ctx.reply(SuiVacancy[iVacancy].desc, {
        reply_markup: vacancyKB
    })
    SuiVacancy = []
})

bot.callbackQuery('cont', async (ctx) => {
    await getSuitableVacancy(ctx)
    console.log('ok')
    await ctx.reply(SuiVacancy[iVacancy].desc, {
        reply_markup: vacancyKB
    })
    SuiVacancy = []
})

bot.callbackQuery('before', async (ctx) => {
    await getSuitableVacancy(ctx)
    scrollV += 1
    if (scrollV == 15) {
        iAdd < SuiAdd.length &&
            await readAd()
            await ctx.reply(SuiAdd[iAdd].desc)
        scrollV = 0
    }
    iVacancy -= 1
    if (iVacancy < 0) {
        iVacancy = 0
    }
    ctx.callbackQuery.message.editText(SuiVacancy[iVacancy].desc, {
        reply_markup: vacancyKB
    })
    SuiVacancy = []
})

bot.callbackQuery('after', async (ctx) => {
    await getSuitableVacancy(ctx)
    scrollV += 1
    iVacancy += 1
    if (scrollV == 15) {
        iAdd < SuiAdd.length &&
        await readAd()
        await ctx.reply(SuiAdd[iAdd].desc)
        scrollV = 0
    }
    console.log(SuiVacancy.length)
    if (iVacancy > SuiVacancy.length) {
        iVacancy = SuiVacancy[SuiVacancy.length - 1]
    }
    ctx.callbackQuery.message.editText(SuiVacancy[iVacancy].desc, {
        reply_markup: vacancyKB
    })
    SuiVacancy = []
})

bot.callbackQuery('c<', async (ctx) => {
    iComplaint -= 1
    if (iComplaint < 0) {
        iComplaint = 0
    }
    ctx.callbackQuery.message.editText(SuiVacancy[iVacancy], {
        reply_markup: complaintKB
    })
})

bot.callbackQuery('c>', async (ctx) => {
    iComplaint += 1
    if (iComplaint > AllComplaint.length) {
        iComplaint = AllComplaint[AllComplaint.length - 1]
    }
    ctx.callbackQuery.message.editText(SuiVacancy[iVacancy], {
        reply_markup: complaintKB
    })
})

bot.callbackQuery('complaint', async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply('Жалоба отправлена, спасибо Вам!')
    await getSuitableVacancy(ctx)
    const complaint = SuiVacancy[iVacancy]
    await addComplaint(complaint.uid, complaint.desc, complaint.city, complaint.workExp, complaint.age)
})

bot.callbackQuery('delete', async () => {
    deleteComplaint()
})

bot.callbackQuery('ban', async () => {
    banUser()
})

bot.callbackQuery('ignore', async () => {
    ignoreComplaint()
})

bot.callbackQuery('editResume', async (ctx) => {
    await ctx.callbackQuery.message.editText('В каком городе ищете работу', {
        reply_markup: whichCityKB
    })
    isUpdate = true
})

bot.callbackQuery('editVacancy', async (ctx) => {
    await ctx.callbackQuery.message.editText('Опишите Вашу вакансию')
    isOpen = true
    isUpdate = true
})

bot.callbackQuery('deleteResume', async (ctx) => {
    await ctx.answerCallbackQuery()
    await deleteMyInfo('worker', myResume)
    await ctx.callbackQuery.message.editText("Резюме удалено")
})

bot.callbackQuery('deleteVacancy', async (ctx) => {
    await ctx.answerCallbackQuery()
    await deleteMyInfo('vacancy', myVacancy)
    await ctx.callbackQuery.message.editText("Вакансия удалена")
})

bot.command('ad').filter(async (ctx) => {
    return ctx.from.id == process.env.ADMIN_ID || ctx.from.id == process.env.ADMIN_ID_SECOND;
}, async (ctx) => {
    isAd = true
    await ctx.reply('Добавьте рекламу')
})

bot.catch((error) => {
    const ctx = error.ctx
    console.log(`Error while handling update ${ctx.update.update_id}`)
    const e = error.error

    if (GrammyError) {
        console.error("Error is request:", e.description)
    } else if (e instanceof HttpError) {
        console.error("Could not connect to Telegram", e)
    } else console.error("Unknown error:", e)
})

bot.start();