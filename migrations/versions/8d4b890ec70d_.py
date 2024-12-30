"""empty message

Revision ID: 8d4b890ec70d
Revises: 5a496ce1131d
Create Date: 2024-12-30 21:40:44.407593

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8d4b890ec70d'
down_revision = '5a496ce1131d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.alter_column('announcement',
               existing_type=sa.BOOLEAN(),
               nullable=False)
        
    op.execute("""
        UPDATE user
        SET web_notif = json_remove(web_notif, '$.anoncement')
        WHERE json_extract(web_notif, '$.anoncement') IS NOT NULL;
    """)
    

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.alter_column('announcement',
               existing_type=sa.BOOLEAN(),
               nullable=True)

    # ### end Alembic commands ###
