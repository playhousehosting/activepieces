import { logger } from 'server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateWebhookTemplate1709581196564 implements MigrationInterface {
    name = 'MigrateWebhookTemplate1709581196564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('MigrateWebhookTemplate1709581196564, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_template')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_template WHERE id = $1', [id])
            const step = parseJson(flowVersion.template.trigger)
            const isString = typeof flowVersion.template.trigger === 'string'
            if (step.type === 'WEBHOOK') {
                step.type = 'PIECE_TRIGGER'
                step.settings = {
                    input: {},
                    'inputUiInfo': step.settings.inputUiInfo,
                    triggerName: 'catch_request',
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.0.1',
                    'pieceType': 'OFFICIAL',
                    'packageType': 'REGISTRY',
                }
                count++
                const result = isString ? JSON.stringify(step) : step
                await queryRunner.query(
                    'UPDATE flow_template SET template = $1 WHERE id = $2',
                    [result, flowVersion.id],
                )
            }
        }
        logger.info('MigrateWebhookTemplate1709581196564, finished flows ' + count)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('rolling back MigrateWebhookTemplate1709581196564, started')

        let count = 0
        const flowVersionsIds = await queryRunner.query('SELECT id FROM flow_template')

        for (const { id } of flowVersionsIds) {
            const [flowVersion] = await queryRunner.query('SELECT * FROM flow_template WHERE id = $1', [id])

            const step = parseJson(flowVersion.template.trigger)
            const isString = typeof flowVersion.template.trigger === 'string'
            if (step.type === 'PIECE_TRIGGER') {
                if (step.settings.pieceName === '@activepieces/piece-webhook') {
                    step.type = 'WEBHOOK'
                    step.settings = {
                        'inputUiInfo': step.settings.inputUiInfo,
                    }
                    count++
                    const result = isString ? JSON.stringify(step) : step
                    await queryRunner.query(
                        'UPDATE flow_template SET template = $1 WHERE id = $2',
                        [result, flowVersion.id],
                    )
                }
            }
        }
        logger.info(
            'rolling back  MigrateWebhookTemplate1709581196564, finished flows ' + count,
        )
    }
}


const parseJson = (json: string) => {
    try {
        return JSON.parse(json)
    }
    catch (e) {
        return json
    }
}
